import os
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth_sdk
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import models


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass

    raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if raw_json:
        cred = credentials.Certificate(json.loads(raw_json))
    else:
        path = os.getenv(
            "FIREBASE_SERVICE_ACCOUNT_PATH",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-service-account.json"),
        )
        if not os.path.exists(path):
            raise HTTPException(status_code=503, detail="Authentication not configured")
        cred = credentials.Certificate(path)

    return firebase_admin.initialize_app(cred)


def verify_firebase_token(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    _ensure_firebase_app()
    token = authorization.split(" ", 1)[1]
    try:
        decoded = firebase_auth_sdk.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token has no email claim")
    return email


def get_current_user(
    email: str = Depends(verify_firebase_token), db: Session = Depends(get_db)
) -> models.User:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_admin(current: models.User = Depends(get_current_user)) -> models.User:
    if current.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current


def require_teacher_or_admin(current: models.User = Depends(get_current_user)) -> models.User:
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    return current


def require_self_or_admin(path_email: str, current: models.User):
    if current.email != path_email and current.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")


def require_self_or_staff(path_email: str, current: models.User):
    if current.email != path_email and current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")


def require_owner_id_or_admin(owner_id: int, current: models.User):
    if current.id != owner_id and current.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")


def require_owner_id_or_staff(owner_id: int, current: models.User):
    if current.id != owner_id and current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
