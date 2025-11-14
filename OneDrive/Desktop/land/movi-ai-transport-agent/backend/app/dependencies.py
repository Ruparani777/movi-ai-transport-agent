from __future__ import annotations

from typing import Generator

from .database import get_session


def session_dependency() -> Generator:
    with get_session() as session:
        yield session

