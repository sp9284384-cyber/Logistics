# One-time script to create the first admin account.
# Usage:  python -m scripts.create_admin --username admin --email admin@ganrajlogistics.in --password 'ganraj@123'
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath("."))

from app.crud.admin import create_admin, get_admin_by_identifier  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = get_admin_by_identifier(db, args.username) or get_admin_by_identifier(db, args.email)
        if existing:
            print(f"Admin '{existing.username}' ({existing.email}) already exists.")
            return
        create_admin(db, args.username, args.email, args.password)
        print(f"Admin '{args.username}' created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
