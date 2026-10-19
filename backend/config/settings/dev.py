"""Development settings for CollabFlow backend."""

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# In-memory channel layer fallback if redis is unavailable locally
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# Local dummy or file cache for development
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "collabflow-dev-cache",
    }
}

# Fast password hasher for faster test runs and seed execution
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Development emails print to console
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
