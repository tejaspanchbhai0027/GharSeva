from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.adapters.api.v1 import auth_router, booking_router, provider_router, payment_router, service_router

app = FastAPI(
    title="GharSeva API",
    description="AI-Powered Home Services Marketplace Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add other domains in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(booking_router.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(provider_router.router, prefix="/api/v1/providers", tags=["Providers"])
app.include_router(payment_router.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(service_router.router, prefix="/api/v1", tags=["Services"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to GharSeva API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
