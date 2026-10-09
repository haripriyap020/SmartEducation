from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Class
from ..schemas import UserCreate, UserLogin, UserResponse, Token, ClassResponse, ClassCreate
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user, require_role

router = APIRouter(prefix="", tags=["Authentication & Classes"])


@router.post("/auth/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # If class_id provided, verify class exists
    if user_in.class_id:
        classroom = db.query(Class).filter(Class.id == user_in.class_id).first()
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected class does not exist"
            )

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role.lower(),
        class_id=user_in.class_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/auth/login", response_model=Token)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/classes", response_model=List[ClassResponse])
def get_all_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()


@router.post("/classes", response_model=ClassResponse)
def create_class(
    class_in: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    new_class = Class(
        class_name=class_in.class_name,
        section=class_in.section,
        academic_year=class_in.academic_year
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class
