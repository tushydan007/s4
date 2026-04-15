import pytest
from django.utils import timezone
from datetime import timedelta

from users.models import User, EmailVerificationToken


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self, create_user):
        user = create_user()
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.check_password("TestPass123!")
        assert user.is_active
        assert not user.email_verified
        assert not user.nin_verified

    def test_user_str(self, user):
        assert str(user) == user.email

    def test_is_fully_verified_false(self, user):
        assert not user.is_fully_verified

    def test_is_fully_verified_email_only(self, user):
        user.email_verified = True
        user.save()
        assert not user.is_fully_verified

    def test_is_fully_verified_nin_only(self, user):
        user.nin_verified = True
        user.save()
        assert not user.is_fully_verified

    def test_is_fully_verified_true(self, user):
        user.email_verified = True
        user.nin_verified = True
        user.save()
        assert user.is_fully_verified

    def test_user_uuid_primary_key(self, user):
        import uuid

        assert isinstance(user.id, uuid.UUID)

    def test_username_field_is_email(self):
        assert User.USERNAME_FIELD == "email"

    def test_required_fields(self):
        assert "username" in User.REQUIRED_FIELDS
        assert "first_name" in User.REQUIRED_FIELDS
        assert "last_name" in User.REQUIRED_FIELDS

    def test_user_ordering(self):
        assert User._meta.ordering == ["-date_joined"]


@pytest.mark.django_db
class TestEmailVerificationToken:
    def test_create_token(self, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        assert str(token) == f"Verification token for {user.email}"
        assert not token.is_used
        assert not token.is_expired

    def test_token_is_expired(self, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() - timedelta(hours=1),
        )
        assert token.is_expired

    def test_token_not_expired(self, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        assert not token.is_expired

    def test_token_default_expiry(self, user):
        token = EmailVerificationToken(user=user)
        token.save()
        assert token.expires_at is not None
        assert token.expires_at > timezone.now()
