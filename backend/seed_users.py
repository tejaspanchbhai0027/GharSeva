"""
Seed script: Creates test users directly in the database.
Run from backend folder: .\\venv\\Scripts\\python.exe seed_users.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Direct DB connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gharseva"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

from app.adapters.database.sqlalchemy_models import User, ServiceProvider, OTPToken

def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

users_to_create = [
    {
        "email": "admin@gharseva.com",
        "password": "Admin@1234",
        "full_name": "Admin User",
        "phone": "9000000001",
        "role": "admin",
    },
    {
        "email": "customer@gharseva.com",
        "password": "Customer@1234",
        "full_name": "Rahul Sharma",
        "phone": "9000000002",
        "role": "customer",
    },
    {
        "email": "provider@gharseva.com",
        "password": "Provider@1234",
        "full_name": "Amit Kumar",
        "phone": "9000000003",
        "role": "provider",
    },
]

print("\n========== GharSeva Seed Script ==========")
for u in users_to_create:
    # Check if already exists
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        print(f"[SKIP] {u['email']} already exists.")
        continue
    user = User(
        email=u["email"],
        password_hash=hash_password(u["password"]),
        full_name=u["full_name"],
        phone=u["phone"],
        role=u["role"],
        is_verified=True,
        is_active=True,
    )
    db.add(user)
    db.flush()  # get user_id

    # Create provider profile if role is provider
    if u["role"] == "provider":
        provider = ServiceProvider(
            user_id=user.user_id,
            experience_years=3,
            avg_rating=4.5,
            total_jobs=25,
            is_available=True,
            service_radius_km=15,
            verification_status="approved",
        )
        db.add(provider)

    db.commit()
    print(f"[OK] Created {u['role']}: {u['email']} | Password: {u['password']}")

db.close()
print("==========================================\n")
print("Login credentials:")
print("  ADMIN    => admin@gharseva.com     | Admin@1234")
print("  CUSTOMER => customer@gharseva.com  | Customer@1234")
print("  PROVIDER => provider@gharseva.com  | Provider@1234")
print("\nAPI Docs: http://localhost:8000/docs")
print("Frontend: http://localhost:5173\n")
