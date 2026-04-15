import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, auth, services
from .routes import auth_routes, blog_routes
from .models import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Blog Generator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Include routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(blog_routes.router, prefix="/api/blogs", tags=["Blogs"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
