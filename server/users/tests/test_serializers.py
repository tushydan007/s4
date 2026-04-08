import pytest
from rest_framework import status

from users.serializers import (
    RegisterSerializer,
    LoginSerializer,
    TwoFactorVerifySerializer,
    NINVerifySerializer,
    UserSerializer,
    ResendVerificationSerializer,
)
from users.models import User


@pytest.mark.django_db
class TestRegisterSerializer:
    def test_valid_data(self):
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_password_mismatch(self):
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "WrongPass2!",
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert "password_confirm" in serializer.errors

    def test_invalid_nin_format(self):
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "abc",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert "nin" in serializer.errors

    def test_duplicate_verified_nin(self, verified_user):
        verified_user.nin = "12345678901"
        verified_user.save()
        data = {
            "email": "another@example.com",
            "username": "another",
            "first_name": "Another",
            "last_name": "User",
            "phone_number": "+2348012345679",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert "nin" in serializer.errors

    def test_create_user(self):
        data = {
            "email": "created@example.com",
            "username": "createduser",
            "first_name": "Created",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.email == "created@example.com"
        assert user.check_password("StrongPass1!")
        assert user.is_active


class TestLoginSerializer:
    def test_valid_data(self):
        data = {"email": "test@example.com", "password": "password123"}
        serializer = LoginSerializer(data=data)
        assert serializer.is_valid()

    def test_missing_email(self):
        data = {"password": "password123"}
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()

    def test_missing_password(self):
        data = {"email": "test@example.com"}
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()


class TestTwoFactorVerifySerializer:
    def test_valid_data(self):
        data = {"otp_code": "123456", "temp_token": "sometoken"}
        serializer = TwoFactorVerifySerializer(data=data)
        assert serializer.is_valid()

    def test_invalid_otp_length(self):
        data = {"otp_code": "123", "temp_token": "sometoken"}
        serializer = TwoFactorVerifySerializer(data=data)
        assert not serializer.is_valid()

    def test_otp_too_long(self):
        data = {"otp_code": "1234567", "temp_token": "sometoken"}
        serializer = TwoFactorVerifySerializer(data=data)
        assert not serializer.is_valid()


class TestNINVerifySerializer:
    def test_valid_data(self):
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        serializer = NINVerifySerializer(data=data)
        assert serializer.is_valid()

    def test_invalid_nin_length(self):
        data = {"nin": "12345", "first_name": "Test", "last_name": "User"}
        serializer = NINVerifySerializer(data=data)
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestUserSerializer:
    def test_serializes_user(self, verified_user):
        serializer = UserSerializer(verified_user)
        data = serializer.data
        assert data["email"] == verified_user.email
        assert data["is_fully_verified"] is True
        assert "id" in data
        assert "date_joined" in data

    def test_read_only_fields(self, user):
        serializer = UserSerializer(
            user,
            data={"email": "hacked@example.com", "nin_verified": True},
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        # email is read-only, should not change
        assert updated.email == user.email
        # nin_verified is read-only, should not change
        assert updated.nin_verified == False


class TestResendVerificationSerializer:
    def test_valid_email(self):
        data = {"email": "test@example.com"}
        serializer = ResendVerificationSerializer(data=data)
        assert serializer.is_valid()

    def test_invalid_email(self):
        data = {"email": "not-an-email"}
        serializer = ResendVerificationSerializer(data=data)
        assert not serializer.is_valid()
