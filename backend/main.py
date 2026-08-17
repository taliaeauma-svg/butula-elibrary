import os
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except (ImportError, ModuleNotFoundError, Exception):
    pass

from fastapi import UploadFile, File
from storage import s3, R2_BUCKET_NAME
from botocore.exceptions import ClientError
import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import engine, Base, SessionLocal
import models
import schemas
import csv
import io
from firebase_auth import (
    get_current_user,
    require_admin,
    verify_firebase_token,
    require_self_or_admin,
    require_teacher_or_admin,
    require_self_or_staff,
    require_owner_id_or_admin,
    require_owner_id_or_staff,
)

Base.metadata.create_all(bind=engine)

MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://butula-elibrary.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "E-Library backend is running!"}


@app.get("/books", response_model=List[schemas.BookOut])
def get_books(db: Session = Depends(get_db)):
    books = db.query(models.Book).all()
    return books

@app.post("/books", response_model=schemas.BookOut)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@app.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/categories", response_model=schemas.CategoryOut)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    new_category = models.Category(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category


@app.put("/categories/{category_id}", response_model=schemas.CategoryOut)
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    existing = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    existing.name = category.name
    db.commit()
    db.refresh(existing)
    return existing


@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    existing = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    db.query(models.Book).filter(models.Book.category_id == category_id).update(
        {"category_id": None}
    )
    db.delete(existing)
    db.commit()
    return {"message": "Category deleted successfully"}

@app.get("/books/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.put("/books/{book_id}", response_model=schemas.BookOut)
def update_book(book_id: int, updated_book: schemas.BookCreate, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    for key, value in updated_book.dict().items():
        setattr(book, key, value)
    db.commit()
    db.refresh(book)
    return book


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.query(models.Download).filter(models.Download.book_id == book_id).delete()
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}

@app.get("/users", response_model=List[schemas.UserOut])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db), staff: models.User = Depends(require_teacher_or_admin)):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()


@app.get("/users/{email}", response_model=schemas.UserOut)
def get_user(email: str, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_self_or_admin(email, current)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{email}/role")
def update_role(email: str, role: str, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


@app.put("/users/{email}/resume", response_model=schemas.UserOut)
def update_resume(email: str, resume: schemas.ResumeUpdate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_self_or_admin(email, current)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.bio = resume.bio
    user.skills = resume.skills
    db.commit()
    db.refresh(user)
    return user

@app.post("/upload")
def upload_file(file: UploadFile = File(...), current: models.User = Depends(get_current_user)):
    content = file.file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
        )

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    try:
        s3.upload_fileobj(io.BytesIO(content), R2_BUCKET_NAME, unique_filename)
    except ClientError as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}")

    file_url = f"{R2_BUCKET_NAME}/{unique_filename}"
    return {"file_url": file_url, "filename": unique_filename}

@app.get("/download/{filename}")
def get_download_url(filename: str):
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET_NAME, "Key": filename},
        ExpiresIn=3600,
    )
    return {"download_url": url}


@app.post("/downloads")
def log_download(payload: dict, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    book_id = payload.get("book_id")
    if not book_id:
        return {"logged": False}

    db.add(models.Download(user_id=current.id, book_id=book_id))
    db.commit()
    return {"logged": True}


@app.get("/downloads/{email}", response_model=List[schemas.DownloadOut])
def get_download_history(email: str, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_self_or_admin(email, current)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rows = (
        db.query(models.Download, models.Book)
        .join(models.Book, models.Download.book_id == models.Book.id)
        .filter(models.Download.user_id == user.id)
        .order_by(models.Download.downloaded_at.desc())
        .all()
    )
    return [
        schemas.DownloadOut(
            id=download.id,
            book_id=book.id,
            title=book.title,
            author=book.author,
            downloaded_at=download.downloaded_at,
        )
        for download, book in rows
    ]


@app.get("/portfolio/{email}", response_model=schemas.PortfolioOut)
def get_portfolio(email: str, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_self_or_staff(email, current)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    items = (
        db.query(models.PortfolioItem)
        .filter(models.PortfolioItem.user_id == user.id)
        .order_by(models.PortfolioItem.created_at.desc())
        .all()
    )
    return schemas.PortfolioOut(bio=user.bio, skills=user.skills, items=items)


@app.post("/portfolio/items", response_model=schemas.PortfolioItemOut)
def create_portfolio_item(item: schemas.PortfolioItemCreate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    new_item = models.PortfolioItem(user_id=current.id, **item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.put("/portfolio/items/{item_id}", response_model=schemas.PortfolioItemOut)
def update_portfolio_item(item_id: int, item: schemas.PortfolioItemCreate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    existing = db.query(models.PortfolioItem).filter(models.PortfolioItem.id == item_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    require_owner_id_or_admin(existing.user_id, current)
    for key, value in item.dict().items():
        setattr(existing, key, value)
    db.commit()
    db.refresh(existing)
    return existing


@app.delete("/portfolio/items/{item_id}")
def delete_portfolio_item(item_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    existing = db.query(models.PortfolioItem).filter(models.PortfolioItem.id == item_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    require_owner_id_or_admin(existing.user_id, current)
    db.delete(existing)
    db.commit()
    return {"message": "Portfolio item deleted successfully"}


@app.get("/portfolio/download/{item_id}")
def get_portfolio_download_url(item_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    item = db.query(models.PortfolioItem).filter(models.PortfolioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    require_owner_id_or_staff(item.user_id, current)
    if not item.file_url:
        raise HTTPException(status_code=404, detail="No file attached to this item")
    filename = item.file_url.split("/").pop()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET_NAME, "Key": filename},
        ExpiresIn=3600,
    )
    return {"download_url": url}

@app.post("/allowed-users/upload")
async def upload_allowed_users(file: UploadFile = File(...), db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    added = 0
    for row in reader:
        admission_number = row.get("admission_number", "").strip()
        email = row.get("email", "").strip().lower() or None
        name = row.get("name", "").strip()
        role = row.get("role", "student").strip() or "student"

        if not admission_number or not name:
            continue

        existing = db.query(models.AllowedUser).filter(
            models.AllowedUser.admission_number == admission_number
        ).first()
        if existing:
            if email and not existing.email:
                existing.email = email
            continue

        db.add(models.AllowedUser(
            admission_number=admission_number, email=email, name=name, role=role
        ))
        added += 1

    db.commit()
    return {"added": added}


@app.get("/allowed-users/{admission_number}", response_model=schemas.AllowedUserOut)
def check_allowed_user(admission_number: str, db: Session = Depends(get_db)):
    user = db.query(models.AllowedUser).filter(
        models.AllowedUser.admission_number == admission_number
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not a registered student or teacher")
    return user


@app.post("/students/sync", response_model=schemas.UserOut)
def sync_student_user(db: Session = Depends(get_db), email: str = Depends(verify_firebase_token)):
    allowed = db.query(models.AllowedUser).filter(
        models.AllowedUser.email == email
    ).first()
    if not allowed:
        raise HTTPException(status_code=404, detail="Not approved")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return existing

    new_user = models.User(name=allowed.name, email=email, role=allowed.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/allowed-users/by-email/{email}", response_model=schemas.AllowedUserOut)
def check_allowed_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(models.AllowedUser).filter(
        models.AllowedUser.email == email
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="This email is not registered with the library")
    return user

@app.post("/admin/migrate-add-email-column")
def migrate_add_email_column(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    from sqlalchemy import text, inspect
    columns = [c["name"] for c in inspect(db.bind).get_columns("allowed_users")]
    if "email" not in columns:
        db.execute(text("ALTER TABLE allowed_users ADD COLUMN email VARCHAR;"))
    db.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_allowed_users_email ON allowed_users(email);"
    ))
    db.commit()
    return {"status": "done"}


@app.post("/admin/migrate-add-cover-column")
def migrate_add_cover_column(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    from sqlalchemy import text, inspect
    columns = [c["name"] for c in inspect(db.bind).get_columns("books")]
    if "cover_url" not in columns:
        db.execute(text("ALTER TABLE books ADD COLUMN cover_url VARCHAR;"))
    db.commit()
    return {"status": "done"}


@app.post("/admin/migrate-add-resume-columns")
def migrate_add_resume_columns(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    from sqlalchemy import text, inspect
    columns = [c["name"] for c in inspect(db.bind).get_columns("users")]
    if "bio" not in columns:
        db.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR;"))
    if "skills" not in columns:
        db.execute(text("ALTER TABLE users ADD COLUMN skills VARCHAR;"))
    db.commit()
    return {"status": "done"}