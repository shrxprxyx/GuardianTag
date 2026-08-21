from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.gamification import Achievement, Challenge, SecurityScore, UserAchievement, XPTransaction
from app.models.user import User
from app.schemas.gamification import (
    AchievementOut,
    ChallengeOut,
    DailyCheckOut,
    SecurityScoreOut,
    UserAchievementOut,
    XPTransactionOut,
)
from app.services.gamification import get_daily_check_status, get_or_create_security_score, perform_daily_check

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/xp", response_model=list[XPTransactionOut])
def list_xp_transactions(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[XPTransaction]:
    return (
        db.query(XPTransaction)
        .filter(XPTransaction.user_id == current_user.id)
        .order_by(XPTransaction.created_at.desc())
        .all()
    )


@router.get("/achievements", response_model=list[AchievementOut])
def list_achievements(db: Session = Depends(get_db)) -> list[Achievement]:
    return db.query(Achievement).order_by(Achievement.name).all()


@router.get("/achievements/unlocked", response_model=list[UserAchievementOut])
def list_unlocked_achievements(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[UserAchievement]:
    return (
        db.query(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.unlocked_at.desc())
        .all()
    )


@router.get("/challenges", response_model=list[ChallengeOut])
def list_challenges(db: Session = Depends(get_db)) -> list[Challenge]:
    return db.query(Challenge).filter(Challenge.is_active.is_(True)).all()


@router.get("/security-score", response_model=SecurityScoreOut)
def get_security_score(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SecurityScore:
    score = get_or_create_security_score(db, current_user)
    db.commit()
    return score


@router.get("/daily-check", response_model=DailyCheckOut)
def get_daily_check(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DailyCheckOut:
    done_today, streak_days, xp_reward = get_daily_check_status(db, current_user)
    return DailyCheckOut(done_today=done_today, streak_days=streak_days, xp_reward=xp_reward)


@router.post("/daily-check", response_model=DailyCheckOut)
def post_daily_check(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DailyCheckOut:
    done_today, streak_days, xp_reward = perform_daily_check(db, current_user)
    return DailyCheckOut(done_today=done_today, streak_days=streak_days, xp_reward=xp_reward)