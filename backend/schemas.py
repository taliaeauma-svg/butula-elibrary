from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BookOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    category_id: Optional[int] = None
    file_url: Optional[str] = None
    upload_date: datetime

    class Config:
        from_attributes = True


class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    category_id: Optional[int] = None
    file_url: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None

    class Config:
        from_attributes = True

class AllowedUserOut(BaseModel):
    admission_number: str
    email: Optional[str] = None
    name: str
    role: str

    class Config:
        from_attributes = True

class DownloadOut(BaseModel):
    id: int
    book_id: int
    title: str
    author: Optional[str] = None
    downloaded_at: datetime