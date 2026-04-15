import os
from datetime import datetime
from sqlalchemy import create_all, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine

# Database URL configuration
# Default to SQLite for local development/demo, but easily switch to MySQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blog_app.db")

# For MySQL, the URL would be: mysql+pymysql://user:password@host:port/dbname
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    blogs = relationship("Blog", back_populates="owner")

class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    topic = Column(String(255))
    tone = Column(String(50))
    keywords = Column(String(255))
    seo_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="blogs")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
