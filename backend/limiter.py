import ipaddress
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from config import settings

logger = logging.getLogger(__name__)


def _is_trusted_proxy(client_ip: str) -> bool:
    """Return True if client_ip falls within any entry in TRUSTED_PROXY_IPS (exact or CIDR)."""
    for entry in settings.TRUSTED_PROXY_IPS:
        try:
            if ipaddress.ip_address(client_ip) in ipaddress.ip_network(entry, strict=False):
                return True
        except ValueError:
            pass
    return False


def _get_real_ip(request) -> str:
    """
    Resolve the real client IP for rate-limiting.

    X-Forwarded-For / X-Real-IP are only honoured when the direct TCP
    connection comes from a known proxy (set TRUSTED_PROXY_IPS in .env).
    Without a trusted-proxy list the raw peer address is used, preventing
    spoofed-header bypass of rate limits.
    """
    client_ip = get_remote_address(request)
    if settings.TRUSTED_PROXY_IPS and _is_trusted_proxy(client_ip):
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
    return client_ip


# Use Redis when REDIS_URL is configured (required for multi-worker deployments).
# Install limits[redis] and set REDIS_URL=redis://... in .env to enable.
_limiter_kwargs = {"key_func": _get_real_ip}
if settings.REDIS_URL:
    _limiter_kwargs["storage_uri"] = settings.REDIS_URL
    logger.info("Rate-limiter: using Redis storage (%s)", settings.REDIS_URL)
else:
    logger.info("Rate-limiter: using in-memory storage (single-worker only)")

limiter = Limiter(**_limiter_kwargs)
