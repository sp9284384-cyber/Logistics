import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    # Simple in-memory sliding-window limiter for public endpoints.

    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/v1/bookings") and request.method == "POST":
            limit = get_settings().RATE_LIMIT_PER_MINUTE
            key = request.client.host if request.client else "unknown"
            now = time.monotonic()
            window = [t for t in self._hits[key] if now - t < 60]
            if len(window) >= limit:
                return JSONResponse(
                    status_code=429, content={"detail": "Too many requests, try again later"}
                )
            window.append(now)
            self._hits[key] = window
        return await call_next(request)
