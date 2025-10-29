"""API layer for exposing burnout risk service via FastAPI."""

from .server import create_app

__all__ = ["create_app"]

