from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="student")
    department = Column(String)
    bio = Column(String)
    skills = Column(String)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))
    file_url = Column(String)
    cover_url = Column(String)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    upload_date = Column(DateTime, default=datetime.utcnow)

class AllowedUser(Base):
    __tablename__ = "allowed_users"

    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    role = Column(String, default="student")


class Download(Base):
    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    downloaded_at = Column(DateTime, default=datetime.utcnow)


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    file_url = Column(String)
    size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
