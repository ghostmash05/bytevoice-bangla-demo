"""Export initial PostgreSQL DDL without connecting to a database."""
from pathlib import Path
from sqlalchemy import create_mock_engine
from agent.config import ROOT
from backend.database import Base
from backend import models


def main():
    statements = ["-- Initial schema. Generated from backend/models.py. Review before applying.", "BEGIN;"]
    def capture(sql, *multiparams, **params):
        statements.append("\n".join(line.rstrip() for line in str(sql.compile(dialect=engine.dialect)).strip().splitlines()) + ";")
    engine = create_mock_engine("postgresql+psycopg://", capture)
    Base.metadata.create_all(engine)
    statements.append("-- When hosted in Supabase, deny direct browser access. The trusted backend")
    statements.append("-- must use a database role that can perform the required operations.")
    for table in Base.metadata.sorted_tables:
        statements.append(f'ALTER TABLE "{table.name}" ENABLE ROW LEVEL SECURITY;')
    statements.append("COMMIT;")
    target = ROOT / "supabase" / "migrations" / "202611040001_initial.sql"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n\n".join(statements) + "\n", encoding="utf-8")
    print("Exported initial PostgreSQL migration. It has not been applied to a hosted database.")


if __name__ == "__main__":
    main()
