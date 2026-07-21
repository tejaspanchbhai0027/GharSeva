from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.adapters.api.v1 import auth_router, provider_router, booking_router, payment_router, service_router, review_router, admin_router

app = FastAPI(
    title="GharSeva API",
    description="API for GharSeva Home Services Platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(provider_router.router, prefix="/api/v1/providers", tags=["Service Providers"])
app.include_router(booking_router.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(payment_router.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(service_router.router, prefix="/api/v1/services", tags=["Services"])
app.include_router(review_router.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["Admin"])

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
