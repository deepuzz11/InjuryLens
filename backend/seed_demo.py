"""
Run once to insert the demo user into the SQLite database.
  cd backend && python seed_demo.py
Credentials: demo@injurylens.com / demo1234
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from auth_models import User
import bcrypt as _bcrypt

DEMO_EMAIL    = "demo@injurylens.com"
DEMO_PASSWORD = "demo1234"
DEMO_NAME     = "Alex Rivera"


def seed():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"[seed] Demo user already exists (id={existing.id}) — skipping.")
            return

        hashed = _bcrypt.hashpw(DEMO_PASSWORD.encode(), _bcrypt.gensalt()).decode()
        user = User(name=DEMO_NAME, email=DEMO_EMAIL, hashed_password=hashed, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[seed] Demo user created — id={user.id}, email={DEMO_EMAIL}, password={DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
