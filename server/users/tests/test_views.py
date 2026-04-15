import pytest
from unittest.mock import patch, MagicMock
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User, EmailVerificationToken


@pytest.mark.django_db
class TestRegisterView:
    url = "/api/users/register/"

    @patch("users.views.verify_nin_with_smileid")
    @patch("users.views.send_verification_email")
    def test_register_success(self, mock_send_email, mock_nin, api_client):
        mock_nin.return_value = {"success": True, "message": "NIN verified."}
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert "user" in response.data
        assert response.data["user"]["email"] == "newuser@example.com"
        mock_send_email.assert_called_once()
        user = User.objects.get(email="newuser@example.com")
        assert user.nin_verified

    @patch("users.views.verify_nin_with_smileid")
    def test_register_nin_failure(self, mock_nin, api_client):
        mock_nin.return_value = {"success": False, "message": "NIN not found."}
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+2348012345678",
            "nin": "12345678901",
            "password": "StrongPass1!",
            "password_confirm": "StrongPass1!",
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_data(self, api_client):
        data = {"email": "bad"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPreRegisterNINVerifyView:
    url = "/api/users/nin/pre-verify/"

    @patch("users.views.verify_nin_with_smileid")
    def test_pre_verify_success(self, mock_nin, api_client):
        mock_nin.return_value = {"success": True, "message": "NIN verified."}
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["verified"] is True

    @patch("users.views.verify_nin_with_smileid")
    def test_pre_verify_failure(self, mock_nin, api_client):
        mock_nin.return_value = {"success": False, "message": "NIN not found."}
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_pre_verify_missing_fields(self, api_client):
        response = api_client.post(self.url, {"nin": "12345678901"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_pre_verify_invalid_nin(self, api_client):
        data = {"nin": "abc", "first_name": "Test", "last_name": "User"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestVerifyEmailView:
    def test_verify_valid_token(self, api_client, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        response = api_client.get(f"/api/users/verify-email/{token.id}/")
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.email_verified

    def test_verify_expired_token(self, api_client, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() - timedelta(hours=1),
        )
        response = api_client.get(f"/api/users/verify-email/{token.id}/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_used_token_user_verified(self, api_client, user):
        user.email_verified = True
        user.save()
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
            is_used=True,
        )
        response = api_client.get(f"/api/users/verify-email/{token.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert "already verified" in response.data["message"].lower()

    def test_verify_used_token_user_not_verified(self, api_client, user):
        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
            is_used=True,
        )
        response = api_client.get(f"/api/users/verify-email/{token.id}/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_invalid_token(self, api_client):
        import uuid

        response = api_client.get(f"/api/users/verify-email/{uuid.uuid4()}/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestResendVerificationView:
    url = "/api/users/resend-verification/"

    @patch("users.views.send_verification_email")
    def test_resend_success(self, mock_send, api_client, user):
        response = api_client.post(self.url, {"email": user.email})
        assert response.status_code == status.HTTP_200_OK
        mock_send.assert_called_once()

    def test_resend_nonexistent_email(self, api_client):
        response = api_client.post(self.url, {"email": "nonexistent@example.com"})
        assert response.status_code == status.HTTP_200_OK  # Silent failure

    @patch("users.views.send_verification_email")
    def test_resend_already_verified(self, mock_send, api_client, verified_user):
        response = api_client.post(self.url, {"email": verified_user.email})
        assert response.status_code == status.HTTP_200_OK
        mock_send.assert_not_called()


@pytest.mark.django_db
class TestLoginView:
    url = "/api/users/login/"

    @patch("users.views.send_mail")
    def test_login_success_sends_otp(self, mock_send_mail, api_client, create_user):
        user = create_user(email="login@example.com", username="loginuser")
        user.email_verified = True
        user.save()
        data = {"email": "login@example.com", "password": "TestPass123!"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["requires_2fa"] is True
        assert "temp_token" in response.data
        mock_send_mail.assert_called_once()

    def test_login_invalid_credentials(self, api_client):
        data = {"email": "wrong@example.com", "password": "wrongpass"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_unverified_email(self, api_client, user):
        data = {"email": user.email, "password": "TestPass123!"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch("users.views.send_mail", side_effect=Exception("SMTP error"))
    def test_login_email_send_failure(self, mock_send_mail, api_client, create_user):
        user = create_user(email="fail@example.com", username="failuser")
        user.email_verified = True
        user.save()
        data = {"email": "fail@example.com", "password": "TestPass123!"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.django_db
class TestLoginEmailOTPVerifyView:
    url = "/api/users/login/verify-otp/"

    @patch("users.views.cache")
    def test_verify_otp_success(self, mock_cache, api_client, create_user):
        user = create_user(email="otp@example.com", username="otpuser")
        user.email_verified = True
        user.save()
        token = str(AccessToken.for_user(user))
        mock_cache.get.return_value = "123456"
        data = {"otp_code": "123456", "temp_token": token}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert "user" in response.data
        mock_cache.delete.assert_called_once()

    @patch("users.views.cache")
    def test_verify_otp_wrong_code(self, mock_cache, api_client, create_user):
        user = create_user(email="otp2@example.com", username="otpuser2")
        user.email_verified = True
        user.save()
        token = str(AccessToken.for_user(user))
        mock_cache.get.return_value = "123456"
        data = {"otp_code": "654321", "temp_token": token}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("users.views.cache")
    def test_verify_otp_expired(self, mock_cache, api_client, create_user):
        user = create_user(email="otp3@example.com", username="otpuser3")
        user.email_verified = True
        user.save()
        token = str(AccessToken.for_user(user))
        mock_cache.get.return_value = None
        data = {"otp_code": "123456", "temp_token": token}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_otp_invalid_token(self, api_client):
        data = {"otp_code": "123456", "temp_token": "invalidtoken"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTwoFactorSetupView:
    url = "/api/users/2fa/setup/"

    def test_get_setup_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_setup_success(self, auth_client, user):
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert "secret" in response.data
        assert "qr_code" in response.data
        assert "provisioning_uri" in response.data

    def test_get_setup_already_enabled(self, auth_client, user):
        user.two_factor_enabled = True
        user.save()
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("users.views.pyotp.TOTP")
    def test_post_confirm_setup_success(self, mock_totp_cls, auth_client, user):
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        mock_totp = MagicMock()
        mock_totp.verify.return_value = True
        mock_totp_cls.return_value = mock_totp
        response = auth_client.post(self.url, {"otp_code": "123456"})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.two_factor_enabled

    @patch("users.views.pyotp.TOTP")
    def test_post_confirm_setup_invalid_code(self, mock_totp_cls, auth_client, user):
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        mock_totp = MagicMock()
        mock_totp.verify.return_value = False
        mock_totp_cls.return_value = mock_totp
        response = auth_client.post(self.url, {"otp_code": "000000"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_confirm_no_secret(self, auth_client, user):
        response = auth_client.post(self.url, {"otp_code": "123456"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


from unittest.mock import MagicMock


@pytest.mark.django_db
class TestTwoFactorVerifyView:
    url = "/api/users/2fa/verify/"

    @patch("users.views.pyotp.TOTP")
    def test_verify_success(self, mock_totp_cls, api_client, create_user):
        user = create_user(email="2fa@example.com", username="twofauser")
        user.two_factor_enabled = True
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        token = str(AccessToken.for_user(user))
        mock_totp = MagicMock()
        mock_totp.verify.return_value = True
        mock_totp_cls.return_value = mock_totp
        data = {"otp_code": "123456", "temp_token": token}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    @patch("users.views.pyotp.TOTP")
    def test_verify_invalid_otp(self, mock_totp_cls, api_client, create_user):
        user = create_user(email="2fa2@example.com", username="twofauser2")
        user.two_factor_enabled = True
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        token = str(AccessToken.for_user(user))
        mock_totp = MagicMock()
        mock_totp.verify.return_value = False
        mock_totp_cls.return_value = mock_totp
        data = {"otp_code": "000000", "temp_token": token}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_invalid_token(self, api_client):
        data = {"otp_code": "123456", "temp_token": "invalidtoken"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTwoFactorDisableView:
    url = "/api/users/2fa/disable/"

    @patch("users.views.pyotp.TOTP")
    def test_disable_success(self, mock_totp_cls, auth_client, user):
        user.two_factor_enabled = True
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        mock_totp = MagicMock()
        mock_totp.verify.return_value = True
        mock_totp_cls.return_value = mock_totp
        response = auth_client.post(self.url, {"otp_code": "123456"})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert not user.two_factor_enabled

    @patch("users.views.pyotp.TOTP")
    def test_disable_invalid_otp(self, mock_totp_cls, auth_client, user):
        user.two_factor_enabled = True
        user.two_factor_secret = "JBSWY3DPEHPK3PXP"
        user.save()
        mock_totp = MagicMock()
        mock_totp.verify.return_value = False
        mock_totp_cls.return_value = mock_totp
        response = auth_client.post(self.url, {"otp_code": "000000"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_not_enabled(self, auth_client, user):
        response = auth_client.post(self.url, {"otp_code": "123456"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestNINVerifyView:
    url = "/api/users/nin/verify/"

    @patch("users.views.verify_nin_with_smileid")
    def test_verify_success(self, mock_nin, auth_client, user):
        mock_nin.return_value = {"success": True, "message": "NIN verified."}
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["verified"] is True
        user.refresh_from_db()
        assert user.nin_verified

    @patch("users.views.verify_nin_with_smileid")
    def test_verify_failure(self, mock_nin, auth_client, user):
        mock_nin.return_value = {"success": False, "message": "NIN not found."}
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_already_verified(self, auth_client, user):
        user.nin_verified = True
        user.save()
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_unauthenticated(self, api_client):
        data = {"nin": "12345678901", "first_name": "Test", "last_name": "User"}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfileView:
    url = "/api/users/profile/"

    def test_get_profile(self, auth_client, user):
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_update_profile(self, auth_client, user):
        response = auth_client.patch(self.url, {"first_name": "Updated"})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.first_name == "Updated"

    def test_profile_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLogoutView:
    url = "/api/users/logout/"

    def test_logout_success(self, auth_client, user):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        response = auth_client.post(self.url, {"refresh": str(refresh)})
        assert response.status_code == status.HTTP_200_OK

    def test_logout_no_token(self, auth_client):
        response = auth_client.post(self.url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_invalid_token(self, auth_client):
        response = auth_client.post(self.url, {"refresh": "invalid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
