import pytest
from unittest.mock import patch, MagicMock
from users.utils import send_verification_email, verify_nin_with_smileid
from users.models import EmailVerificationToken


@pytest.mark.django_db
class TestSendVerificationEmail:
    @patch("users.utils.send_mail")
    def test_sends_email(self, mock_send_mail, user):
        send_verification_email(user)
        mock_send_mail.assert_called_once()
        assert EmailVerificationToken.objects.filter(user=user).exists()

    @patch("users.utils.send_mail")
    def test_invalidates_existing_tokens(self, mock_send_mail, user):
        # Create an existing token
        from django.utils import timezone
        from datetime import timedelta
        old_token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        send_verification_email(user)
        old_token.refresh_from_db()
        assert old_token.is_used


class TestVerifyNINWithSmileID:
    @patch("users.utils.settings")
    def test_mock_mode_valid_nin(self, mock_settings):
        mock_settings.SMILE_ID_PARTNER_ID = ""
        mock_settings.SMILE_ID_API_KEY = ""
        result = verify_nin_with_smileid("user1", "12345678901", "Test", "User")
        assert result["success"] is True

    @patch("users.utils.settings")
    def test_mock_mode_invalid_nin(self, mock_settings):
        mock_settings.SMILE_ID_PARTNER_ID = ""
        mock_settings.SMILE_ID_API_KEY = ""
        result = verify_nin_with_smileid("user1", "abc", "Test", "User")
        assert result["success"] is False
