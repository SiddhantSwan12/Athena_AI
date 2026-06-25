"""Small per-process limits for expensive investigation workflows."""
import time
from collections import defaultdict, deque

_WINDOW_SECONDS = 10 * 60
_MAX_INVESTIGATIONS = 10
_requests: dict[str, deque[float]] = defaultdict(deque)


class InvestigationRateLimitError(RuntimeError):
    pass


def enforce_investigation_rate(user_id: str, now: float | None = None) -> None:
    current = time.monotonic() if now is None else now
    cutoff = current - _WINDOW_SECONDS
    history = _requests[user_id]
    while history and history[0] <= cutoff:
        history.popleft()
    if len(history) >= _MAX_INVESTIGATIONS:
        raise InvestigationRateLimitError(
            "Investigation limit reached. Please wait a few minutes and try again."
        )
    history.append(current)


def reset_investigation_limits() -> None:
    _requests.clear()
