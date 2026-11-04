"""ASGI deployment entrypoint; configuration comes from server environment."""
from backend.app import create_app

app = create_app()
