"""Run booking tests in disposable schemas on the configured demo PostgreSQL.

Never drops public tables. Credentials stay in ignored .local/supabase.env.
Each inherited test gets a fresh schema and connection pool.
"""
import runpy
import unittest
from uuid import uuid4
from unittest.mock import patch

from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from agent.config import ROOT

BookingTests = runpy.run_path(str(ROOT / "tests" / "test_booking.py"))["BookingTests"]


class PostgresBookingTests(BookingTests):
    def setUp(self):
        settings = dotenv_values(ROOT / ".local" / "supabase.env")
        self.schema = "test_clinic_" + uuid4().hex
        url = make_url(settings["POSTGRES_URL_NON_POOLING"]).set(drivername="postgresql+psycopg")
        self.admin = create_engine(url, pool_pre_ping=True)
        with self.admin.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{self.schema}"'))
        # Supabase's session pooler ignores startup search_path options. Qualify
        # every ORM table explicitly instead of risking writes to public.
        with patch.dict(BookingTests.setUp.__globals__, {"make_engine": lambda ignored: create_engine(
                url, pool_pre_ping=True, execution_options={"schema_translate_map": {None: self.schema}})}):
            super().setUp()

    def tearDown(self):
        try:
            super().tearDown()
        finally:
            # Generated identifier is constrained to an explicit test-only prefix.
            if not self.schema.startswith("test_clinic_") or not self.schema[12:].isalnum():
                raise RuntimeError("Unsafe test schema identifier")
            with self.admin.begin() as connection:
                connection.execute(text(f'DROP SCHEMA "{self.schema}" CASCADE'))
            self.admin.dispose()


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PostgresBookingTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
