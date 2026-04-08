import pytest
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User, EmailVerificationToken
from reports.models import Report, ReportMedia
from stations.models import SecurityStation


@pytest.fixture(autouse=True)
def _disable_throttling(settings):
    """Disable rate throttling for all tests."""
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {},
    }
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user(db):
    def _create_user(**kwargs):
        defaults = {
            "email": "test@example.com",
            "username": "testuser",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "+2348012345678",
        }
        defaults.update(kwargs)
        password = defaults.pop("password", "TestPass123!")
        user = User.objects.create_user(password=password, **defaults)
        return user
    return _create_user


@pytest.fixture
def user(create_user):
    return create_user()


@pytest.fixture
def verified_user(create_user):
    u = create_user(
        email="verified@example.com",
        username="verifieduser",
    )
    u.email_verified = True
    u.nin_verified = True
    u.save(update_fields=["email_verified", "nin_verified"])
    return u


@pytest.fixture
def auth_client(api_client, user):
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def verified_auth_client(api_client, verified_user):
    refresh = RefreshToken.for_user(verified_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def station(db):
    return SecurityStation.objects.create(
        name="Test Police Station",
        station_type="police",
        latitude=9.0579,
        longitude=7.4951,
        address="123 Test Street, Abuja",
        phone_number="+2348012345678",
    )


@pytest.fixture
def report(verified_user):
    return Report.objects.create(
        user=verified_user,
        title="Test Report",
        description="Test description",
        latitude=9.0579,
        longitude=7.4951,
        category="robbery",
        severity="high",
    )
