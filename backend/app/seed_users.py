#!/usr/bin/env python3
"""
Seed Script for CAMPUS-NEXUS Role-Based Access Control.
Creates standard test accounts for:
- Admin (admin@nitx.demo)
- Faculty (faculty@nitx.demo)
- Student (student@nitx.demo)
- Other / Staff (staff@nitx.demo)

All passwords are securely hashed using bcrypt.
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
backend_path = Path(__file__).resolve().parents[1]
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

try:
    from .database import SessionLocal, Base, engine
    from .models import College, User
    from .security import hash_password
except ImportError:
    from app.database import SessionLocal, Base, engine
    from app.models import College, User
    from app.security import hash_password


CORE_SEED_USERS = [
    # (email, password, full_name, role, department)
    ("admin@nitx.demo", "Admin@123", "Chief Administrator", "admin", "Administration"),
    ("faculty@nitx.demo", "Faculty@123", "Prof. Vikram Sen", "faculty", "CSE"),
    ("student@nitx.demo", "Student@123", "Aarav Sharma", "student", "CSE"),
    ("staff@nitx.demo", "Staff@123", "Sunil Verma (Lab Warden)", "other", "Facilities"),
    # Compatibility demo accounts
    ("professor@nitx.demo", "professor", "Prof. Priya Mehta", "professor", "CSE"),
    ("student001@nitx.demo", "student123", "Student Demo", "student", "CSE"),
    ("technician@nitx.demo", "technician", "Campus Technician", "technician", "Facilities"),
]


def seed_auth_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Ensure default college exists
        college = db.query(College).filter(College.code == "NITX").first()
        if not college:
            college = College(
                id="northstar",
                name="Northstar Institute of Technology",
                code="NITX",
                tier="autonomous_enterprise",
                student_count=200,
            )
            db.add(college)
            db.flush()

        seeded_count = 0
        updated_count = 0

        for email, password, full_name, role, dept in CORE_SEED_USERS:
            user = db.query(User).filter((User.email == email) | (User.id == f"usr-{email.replace('@', '-').replace('.', '-')}")).first()
            if not user:
                user = User(
                    id=f"usr-{email.replace('@', '-').replace('.', '-')}",
                    tenant_id=college.id,
                    email=email,
                    hashed_password=hash_password(password),
                    full_name=full_name,
                    role=role,
                    department=dept,
                    semester=5,
                    cgpa=8.8 if role == "student" else 0.0,
                )
                db.add(user)
                seeded_count += 1
            else:
                # Update password to ensure it matches the test credentials
                user.hashed_password = hash_password(password)
                user.role = role
                user.full_name = full_name
                updated_count += 1

        db.commit()
        print(f"Authentication Seed Complete! Created: {seeded_count}, Updated: {updated_count}")
        print("\nTest Credentials Ready:")
        print("  • Admin:   admin@nitx.demo   / Admin@123   (Role: admin)")
        print("  • Faculty: faculty@nitx.demo / Faculty@123 (Role: faculty)")
        print("  • Student: student@nitx.demo / Student@123 (Role: student)")
        print("  • Other:   staff@nitx.demo   / Staff@123   (Role: other)")
    except Exception as e:
        db.rollback()
        print(f"Error seeding auth users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_auth_users()
