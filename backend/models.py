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
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    upload_date = Column(DateTime, default=datetime.utcnow)

class AllowedUser(Base):
    __tablename__ = "allowed_users"

    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    role = Column(String, default="student")
