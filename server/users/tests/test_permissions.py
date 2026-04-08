import pytest
from users.permissions import IsEmailVerified, IsNINVerified, IsFullyVerified
from unittest.mock import MagicMock


class TestIsEmailVerified:
    def test_authenticated_and_verified(self):
        perm = IsEmailVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.email_verified = True
        assert perm.has_permission(request, None) is True

    def test_authenticated_not_verified(self):
        perm = IsEmailVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.email_verified = False
        assert perm.has_permission(request, None) is False

    def test_unauthenticated(self):
        perm = IsEmailVerified()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.email_verified = False
        assert perm.has_permission(request, None) is False


class TestIsNINVerified:
    def test_authenticated_and_verified(self):
        perm = IsNINVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.nin_verified = True
        assert perm.has_permission(request, None) is True

    def test_authenticated_not_verified(self):
        perm = IsNINVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.nin_verified = False
        assert perm.has_permission(request, None) is False

    def test_unauthenticated(self):
        perm = IsNINVerified()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.nin_verified = False
        assert perm.has_permission(request, None) is False


class TestIsFullyVerified:
    def test_fully_verified(self):
        perm = IsFullyVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.email_verified = True
        request.user.nin_verified = True
        assert perm.has_permission(request, None) is True

    def test_only_email_verified(self):
        perm = IsFullyVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.email_verified = True
        request.user.nin_verified = False
        assert perm.has_permission(request, None) is False

    def test_only_nin_verified(self):
        perm = IsFullyVerified()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.email_verified = False
        request.user.nin_verified = True
        assert perm.has_permission(request, None) is False

    def test_unauthenticated(self):
        perm = IsFullyVerified()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.email_verified = True
        request.user.nin_verified = True
        assert perm.has_permission(request, None) is False
