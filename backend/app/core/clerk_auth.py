import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException
from app.core.config import settings

jwks_client = PyJWKClient(settings.CLERK_JWKS_URL)

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload  # contains "sub" = clerk user id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")