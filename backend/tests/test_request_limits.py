import pytest

from services import request_limits


def test_investigation_rate_limit_is_bounded_and_expires():
    request_limits.reset_investigation_limits()
    for index in range(10):
        request_limits.enforce_investigation_rate("user-1", now=float(index))

    with pytest.raises(request_limits.InvestigationRateLimitError):
        request_limits.enforce_investigation_rate("user-1", now=10)

    request_limits.enforce_investigation_rate(
        "user-1",
        now=request_limits._WINDOW_SECONDS + 1,
    )


def test_investigation_limits_are_per_user():
    request_limits.reset_investigation_limits()
    for index in range(10):
        request_limits.enforce_investigation_rate("user-1", now=float(index))

    request_limits.enforce_investigation_rate("user-2", now=10)
