"""Create local development secrets once. Never prints their values."""

import os
import secrets
from argon2 import PasswordHasher
from dotenv import dotenv_values, set_key
from agent.config import ROOT


def main():
    env = ROOT / ".env.local"
    values = dotenv_values(env)
    for key in ("AGENT_API_SECRET",):
        if not values.get(key):
            set_key(str(env), key, secrets.token_urlsafe(48))
    if not values.get("REVIEWER_PASSWORD_HASH"):
        password = secrets.token_urlsafe(18)
        set_key(str(env), "REVIEWER_PASSWORD_HASH", PasswordHasher().hash(password))
        credentials = ROOT / ".local" / "reviewer-credentials.txt"
        credentials.parent.mkdir(exist_ok=True)
        credentials.write_text("Local reviewer account\nUsername: reviewer\nPassword: " + password + "\n", encoding="utf-8")
        print("Reviewer credentials saved in ignored .local/reviewer-credentials.txt")
    defaults = {"REVIEWER_USERNAME": "reviewer", "COOKIE_SECURE": "false", "APP_ENV": "development",
        "BACKEND_URL": "http://127.0.0.1:8000", "WEB_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000"}
    for key, value in defaults.items():
        if not values.get(key):
            set_key(str(env), key, value)
    print("Local settings prepared. Secret values were not printed.")


if __name__ == "__main__":
    main()
