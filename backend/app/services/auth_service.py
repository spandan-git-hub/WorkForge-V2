from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut


async def register_user(db: AsyncSession, data: RegisterRequest) -> TokenResponse:
    """Register a new user, hash password, generate JWT, and return TokenResponse."""
    normalized_email = data.email.lower().strip()
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == normalized_email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    
    # Create new user
    hashed = hash_password(data.password)
    user = User(
        name=data.name.strip(),
        email=normalized_email,
        password_hash=hashed,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create token
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(token=token, user=UserOut.model_validate(user))


async def login_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    """Authenticate a user by email/password and return TokenResponse."""
    normalized_email = data.email.lower().strip()
    
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(token=token, user=UserOut.model_validate(user))
