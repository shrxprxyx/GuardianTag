from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import GuardianLevel
from app.models.gamification import (
    Achievement,
    Challenge,
    ChallengeCompletion,
    SecurityScore,
    UserAchievement,
    XPTransaction,
)
from app.models.user import User

# Cumulative score needed to reach each level. Kept ordered lowest to highest;
# level is whichever is the last threshold the score has crossed.
LEVEL_THRESHOLDS: list[tuple[int, GuardianLevel]] = [
    (0, GuardianLevel.ROOKIE),
    (100, GuardianLevel.WATCHMAN),
    (300, GuardianLevel.GUARDIAN),
    (700, GuardianLevel.SENTINEL),
    (1500, GuardianLevel.HOSTEL_PROTECTOR),
]

DAILY_CHECK_XP_REWARD = 15
DAILY_CHECK_REFERENCE_TYPE = "daily_check"


def _level_for_score(score: int) -> GuardianLevel:
    level = GuardianLevel.ROOKIE
    for threshold, candidate in LEVEL_THRESHOLDS:
        if score >= threshold:
            level = candidate
    return level


def get_or_create_security_score(db: Session, user: User) -> SecurityScore:
    score = db.query(SecurityScore).filter(SecurityScore.user_id == user.id).first()
    if score is None:
        score = SecurityScore(
            user_id=user.id,
            score=0,
            level=GuardianLevel.ROOKIE,
            streak_days=0,
            # Deliberately not "now": award_xp's streak logic checks whether
            # last_calculated_at was today/yesterday/older. Seeding this with
            # "now" would make the very first-ever award think a streak day
            # was already credited today and skip incrementing it to 1.
            last_calculated_at=datetime(1970, 1, 1, tzinfo=timezone.utc),
        )
        db.add(score)
        db.flush()
    return score


def award_xp(
    db: Session,
    user: User,
    amount: int,
    reason: str,
    reference_type: str | None = None,
    reference_id: UUID | None = None,
) -> XPTransaction:
    """Records an XP transaction and updates the user's rolling score/level/streak.

    Only ever called for a positive security habit (arming an asset, resolving
    an incident, disarming within the alert window, or checking in for the
    day) - never for the sensor trigger itself, so gamification can't reward
    setting off an alarm.
    """
    now = datetime.now(timezone.utc)
    transaction = XPTransaction(
        user_id=user.id,
        amount=amount,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        created_at=now,
    )
    db.add(transaction)

    security_score = get_or_create_security_score(db, user)
    today = now.date()
    last_date = security_score.last_calculated_at.date() if security_score.last_calculated_at else None

    if last_date == today:
        pass  # streak already credited for today
    elif last_date == today - timedelta(days=1):
        security_score.streak_days += 1
    else:
        security_score.streak_days = 1

    security_score.score += amount
    security_score.level = _level_for_score(security_score.score)
    security_score.last_calculated_at = now

    db.commit()
    db.refresh(transaction)
    return transaction


def has_checked_in_today(db: Session, user: User) -> bool:
    """Whether the user has already claimed today's daily-check XP.

    Deliberately checked via a dedicated daily_check XP transaction rather
    than SecurityScore.last_calculated_at's date, since that timestamp is
    bumped by ANY award_xp call (arming an asset, resolving an incident,
    etc) - using it here would wrongly report "already checked in today"
    just because some other XP-earning action happened today.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.user_id == user.id,
            XPTransaction.reference_type == DAILY_CHECK_REFERENCE_TYPE,
            XPTransaction.created_at >= today_start,
        )
        .first()
        is not None
    )


def get_daily_check_status(db: Session, user: User) -> tuple[bool, int, int]:
    """Read-only status check - does not award anything. Returns
    (done_today, streak_days, xp_reward)."""
    security_score = get_or_create_security_score(db, user)
    db.commit()
    return has_checked_in_today(db, user), security_score.streak_days, DAILY_CHECK_XP_REWARD


def perform_daily_check(db: Session, user: User) -> tuple[bool, int, int]:
    """Claims today's daily-check XP if not already claimed today. Idempotent:
    calling this again later the same day just reports the existing state
    rather than double-awarding. Returns (done_today, streak_days, xp_reward)."""
    if has_checked_in_today(db, user):
        security_score = get_or_create_security_score(db, user)
        db.commit()
        return True, security_score.streak_days, DAILY_CHECK_XP_REWARD

    award_xp(db, user, DAILY_CHECK_XP_REWARD, "Daily guardian check-in", reference_type=DAILY_CHECK_REFERENCE_TYPE)
    evaluate_gamification(db, user)

    security_score = get_or_create_security_score(db, user)
    db.commit()
    return True, security_score.streak_days, DAILY_CHECK_XP_REWARD


def _metric_value(db: Session, user: User, security_score: SecurityScore, metric: str) -> int:
    if metric == "streak_days":
        return security_score.streak_days

    if metric in ("asset_arm_count", "incident_resolved_count", "incident_avoided_count"):
        reference_type = {
            "asset_arm_count": "asset_arm",
            "incident_resolved_count": "incident_resolved",
            "incident_avoided_count": "incident_avoided",
        }[metric]
        count_expr = (
            func.count(func.distinct(XPTransaction.reference_id))
            if metric == "asset_arm_count"
            else func.count(XPTransaction.id)
        )
        return (
            db.query(count_expr)
            .filter(XPTransaction.user_id == user.id, XPTransaction.reference_type == reference_type)
            .scalar()
            or 0
        )

    return 0


def check_achievements(db: Session, user: User) -> list[Achievement]:
    """Unlocks any not-yet-unlocked achievement whose criteria the user now meets."""
    security_score = get_or_create_security_score(db, user)
    unlocked_ids = {
        row.achievement_id
        for row in db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user.id)
    }

    newly_unlocked: list[Achievement] = []
    for achievement in db.query(Achievement).all():
        if achievement.id in unlocked_ids:
            continue
        criteria = achievement.criteria or {}
        metric, target = criteria.get("metric"), criteria.get("target")
        if metric is None or target is None:
            continue
        if _metric_value(db, user, security_score, metric) >= target:
            db.add(
                UserAchievement(
                    user_id=user.id,
                    achievement_id=achievement.id,
                    unlocked_at=datetime.now(timezone.utc),
                )
            )
            db.commit()
            newly_unlocked.append(achievement)
            if achievement.xp_reward:
                award_xp(
                    db,
                    user,
                    achievement.xp_reward,
                    f"Achievement unlocked: {achievement.name}",
                    reference_type="achievement",
                    reference_id=achievement.id,
                )

    return newly_unlocked


def check_challenges(db: Session, user: User) -> list[Challenge]:
    """Marks any active challenge complete whose criteria the user now meets (once each)."""
    security_score = get_or_create_security_score(db, user)
    completed_ids = {
        row.challenge_id
        for row in db.query(ChallengeCompletion.challenge_id).filter(ChallengeCompletion.user_id == user.id)
    }

    newly_completed: list[Challenge] = []
    for challenge in db.query(Challenge).filter(Challenge.is_active.is_(True)).all():
        if challenge.id in completed_ids:
            continue
        criteria = challenge.criteria or {}
        metric, target = criteria.get("metric"), criteria.get("target")
        if metric is None or target is None:
            continue
        if _metric_value(db, user, security_score, metric) >= target:
            db.add(
                ChallengeCompletion(
                    user_id=user.id,
                    challenge_id=challenge.id,
                    completed_at=datetime.now(timezone.utc),
                )
            )
            db.commit()
            newly_completed.append(challenge)
            if challenge.xp_reward:
                award_xp(
                    db,
                    user,
                    challenge.xp_reward,
                    f"Challenge completed: {challenge.title}",
                    reference_type="challenge",
                    reference_id=challenge.id,
                )

    return newly_completed


def evaluate_gamification(db: Session, user: User) -> None:
    """Convenience hook: call after any XP-earning action to unlock anything newly qualified."""
    check_achievements(db, user)
    check_challenges(db, user)