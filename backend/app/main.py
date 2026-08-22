from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routes import (
    auth, subjects, topics, exams, study_plan, sessions, quizzes, analytics, ai_tutor, notifications
)
from app.utils.sample_data import seed_demo_data_if_empty

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Seed demo data for instant out-of-the-box readiness
    db = SessionLocal()
    try:
        seed_demo_data_if_empty(db)
    except Exception as e:
        print(f"Demo data seed note: {e}")
    finally:
        db.close()
    
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Adaptive AI-Powered Study Planning Platform with Deterministic Scheduling & Analytics",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again later."}
    )

# Register API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(subjects.router, prefix=api_prefix)
app.include_router(topics.router, prefix=api_prefix)
app.include_router(exams.router, prefix=api_prefix)
app.include_router(study_plan.router, prefix=api_prefix)
app.include_router(sessions.router, prefix=api_prefix)
app.include_router(quizzes.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(ai_tutor.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for Render/Kubernetes deployment."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for OpenAPI documentation.",
        "docs_url": "/docs"
    }
