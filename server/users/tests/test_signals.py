import pytest
from unittest.mock import patch
import logging

from users.models import User


@pytest.mark.django_db
class TestUserSignals:
    def test_log_user_creation(self, caplog):
        with caplog.at_level(logging.INFO, logger="users.signals"):
            User.objects.create_user(
                email="signal@example.com",
                username="signaluser",
                first_name="Signal",
                last_name="User",
                password="TestPass123!",
            )
            assert any(
                "signal@example.com" in record.message for record in caplog.records
            )
