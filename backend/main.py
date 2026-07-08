from fastapi import UploadFile, File
from storage import s3, R2_BUCKET_NAME
import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, Base, SessionLocal
import models
import schemas
import csv
import io

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-actual-vercel-url.vercel.app",
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
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

@app.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/categories", response_model=schemas.CategoryOut)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    new_category = models.Category(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category
    return new_book

@app.get("/books/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.put("/books/{book_id}", response_model=schemas.BookOut)
def update_book(book_id: int, updated_book: schemas.BookCreate, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    for key, value in updated_book.dict().items():
        setattr(book, key, value)
    db.commit()
    db.refresh(book)
    return book


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}

@app.post("/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        return existing

    new_user = models.User(name=user.name, email=user.email, role="student")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/users/{email}", response_model=schemas.UserOut)
def get_user(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{email}/role")
def update_role(email: str, role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"

    s3.upload_fileobj(file.file, R2_BUCKET_NAME, unique_filename)

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

@app.post("/allowed-users/upload")
async def upload_allowed_users(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    added = 0
    for row in reader:
        admission_number = row.get("admission_number", "").strip()
        name = row.get("name", "").strip()
        role = row.get("role", "student").strip() or "student"

        if not admission_number or not name:
            continue

        existing = db.query(models.AllowedUser).filter(
            models.AllowedUser.admission_number == admission_number
        ).first()
        if existing:
            continue

        db.add(models.AllowedUser(admission_number=admission_number, name=name, role=role))
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
def sync_student_user(payload: dict, db: Session = Depends(get_db)):
    admission_number = payload.get("admission_number")
    allowed = db.query(models.AllowedUser).filter(
        models.AllowedUser.admission_number == admission_number
    ).first()
    if not allowed:
        raise HTTPException(status_code=404, detail="Not approved")

    email = f"{admission_number}@butula.elibrary.local"
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return existing

    new_user = models.User(name=allowed.name, email=email, role=allowed.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user  