from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the limiter globally
# 100 requests per minute by default for most routes
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
