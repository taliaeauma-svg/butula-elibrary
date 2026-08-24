from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal


class BookOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    category_id: Optional[int] = None
    file_url: Optional[str] = None
    cover_url: Optional[str] = None
    upload_date: datetime

    class Config:
        from_attributes = True


class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    category_id: Optional[int] = None
    file_url: Optional[str] = None
    cover_url: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None

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

class PortfolioItemCreate(BaseModel):
    type: Literal["project", "certificate"]
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None

class PortfolioItemOut(BaseModel):
    id: int
    type: str
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    size_bytes: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class PortfolioOut(BaseModel):
    bio: Optional[str] = None
    skills: Optional[str] = None
    items: List[PortfolioItemOut]
    used_bytes: int
    limit_bytes: int

class ResumeUpdate(BaseModel):
    bio: Optional[str] = None
    skills: Optional[str] = None