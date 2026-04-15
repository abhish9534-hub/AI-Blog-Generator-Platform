from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from .. import models, auth, services

router = APIRouter()

class BlogCreate(BaseModel):
    topic: str
    tone: str
    keywords: str
    length: str

class BlogResponse(BaseModel):
    id: int
    title: str
    content: str
    topic: str
    tone: str
    keywords: str
    seo_description: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

@router.post("/generate", response_model=BlogResponse)
async def generate_blog(
    blog_in: BlogCreate, 
    db: Session = Depends(models.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Call Gemini Service
    generated_data = await services.gemini_service.generate_blog(
        topic=blog_in.topic,
        tone=blog_in.tone,
        keywords=blog_in.keywords,
        length=blog_in.length
    )
    
    # Save to database
    new_blog = models.Blog(
        user_id=current_user.id,
        title=generated_data["title"],
        content=generated_data["content"],
        topic=blog_in.topic,
        tone=blog_in.tone,
        keywords=blog_in.keywords,
        seo_description=generated_data["seo_description"]
    )
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    
    # Format response
    return {
        **new_blog.__dict__,
        "created_at": new_blog.created_at.isoformat()
    }

@router.get("/", response_model=List[BlogResponse])
def get_user_blogs(
    db: Session = Depends(models.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    blogs = db.query(models.Blog).filter(models.Blog.user_id == current_user.id).order_by(models.Blog.created_at.desc()).all()
    return [
        {**blog.__dict__, "created_at": blog.created_at.isoformat()}
        for blog in blogs
    ]

@router.get("/{blog_id}", response_model=BlogResponse)
def get_blog(
    blog_id: int,
    db: Session = Depends(models.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id, models.Blog.user_id == current_user.id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {**blog.__dict__, "created_at": blog.created_at.isoformat()}

@router.delete("/{blog_id}")
def delete_blog(
    blog_id: int,
    db: Session = Depends(models.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id, models.Blog.user_id == current_user.id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(blog)
    db.commit()
    return {"message": "Blog deleted successfully"}
