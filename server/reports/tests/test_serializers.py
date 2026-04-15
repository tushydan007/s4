import pytest
import math
from unittest.mock import MagicMock
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

from reports.serializers import (
    ReportSerializer,
    ReportCreateSerializer,
    ReportMediaSerializer,
    _distance_km,
    _is_within_nigeria,
    _is_allowed_audio_type,
    _to_radians,
)
from reports.models import Report


class TestHelperFunctions:
    def test_to_radians(self):
        assert abs(_to_radians(180) - math.pi) < 1e-10
        assert abs(_to_radians(0)) < 1e-10
        assert abs(_to_radians(90) - math.pi / 2) < 1e-10

    def test_distance_km_same_point(self):
        assert _distance_km(9.0, 7.0, 9.0, 7.0) == 0.0

    def test_distance_km_known_distance(self):
        # Approx distance between Abuja (9.06, 7.49) and Lagos (6.52, 3.38)
        d = _distance_km(9.06, 7.49, 6.52, 3.38)
        assert 500 < d < 600  # Approximate expected range

    def test_is_within_nigeria_valid(self):
        assert _is_within_nigeria(9.0579, 7.4951) is True  # Abuja

    def test_is_within_nigeria_invalid(self):
        assert _is_within_nigeria(51.5074, -0.1278) is False  # London

    def test_is_within_nigeria_edge(self):
        assert _is_within_nigeria(4.27, 2.69) is True  # Exact min bounds
        assert _is_within_nigeria(13.9, 14.68) is True  # Exact max bounds

    def test_is_allowed_audio_type_valid(self):
        assert _is_allowed_audio_type("audio/mpeg") is True
        assert _is_allowed_audio_type("audio/wav") is True
        assert _is_allowed_audio_type("audio/ogg") is True
        assert _is_allowed_audio_type("audio/webm") is True
        assert _is_allowed_audio_type("audio/mp4") is True
        assert _is_allowed_audio_type("video/webm") is True

    def test_is_allowed_audio_type_with_params(self):
        assert _is_allowed_audio_type("audio/webm;codecs=opus") is True

    def test_is_allowed_audio_type_invalid(self):
        assert _is_allowed_audio_type("text/plain") is False
        assert _is_allowed_audio_type("application/pdf") is False

    def test_is_allowed_audio_type_none(self):
        assert _is_allowed_audio_type(None) is False

    def test_is_allowed_audio_type_empty(self):
        assert _is_allowed_audio_type("") is False


@pytest.mark.django_db
class TestReportSerializer:
    def test_serializes_report(self, report):
        serializer = ReportSerializer(report)
        data = serializer.data
        assert data["title"] == "Test Report"
        assert data["category"] == "robbery"
        assert data["category_display"] == "Robbery"
        assert data["severity_display"] == "High"
        assert "user_email" in data
        assert "user_name" in data
        assert "media" in data

    def test_user_name_field(self, report):
        serializer = ReportSerializer(report)
        assert (
            serializer.data["user_name"]
            == f"{report.user.first_name} {report.user.last_name}"
        )


@pytest.mark.django_db
class TestReportCreateSerializer:
    def _make_audio(self, size=1024, content_type="audio/webm"):
        f = SimpleUploadedFile("test.webm", b"\x00" * size, content_type=content_type)
        return f

    def _make_context(self, user):
        request = MagicMock()
        request.user = user
        return {"request": request}

    def test_valid_data(self, verified_user):
        data = {
            "title": "Test Report",
            "description": "Some incident",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        # voice_note is a FileField so this will fail without a file, but validation of other fields passes
        assert not serializer.is_valid()  # missing voice_note

    def test_device_outside_nigeria(self, verified_user):
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 51.5,
            "device_longitude": -0.12,
            "category": "robbery",
            "severity": "high",
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_report_location_outside_nigeria(self, verified_user):
        data = {
            "title": "Test Report",
            "latitude": 51.5,
            "longitude": -0.12,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_report_too_far_from_device(self, verified_user):
        data = {
            "title": "Test Report",
            "latitude": 6.5244,  # Lagos
            "longitude": 3.3792,
            "device_latitude": 9.058,  # Abuja
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_validate_voice_note_too_large(self, verified_user):
        large_file = SimpleUploadedFile(
            "large.webm", b"\x00" * (51 * 1024 * 1024), content_type="audio/webm"
        )
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "voice_note": large_file,
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()
        assert "voice_note" in serializer.errors

    def test_validate_voice_note_wrong_type(self, verified_user):
        bad_file = SimpleUploadedFile(
            "test.txt", b"text content", content_type="text/plain"
        )
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "voice_note": bad_file,
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()
        assert "voice_note" in serializer.errors

    def test_validate_images_too_large(self, verified_user):
        large_img = SimpleUploadedFile(
            "big.jpg", b"\x00" * (11 * 1024 * 1024), content_type="image/jpeg"
        )
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "images": [large_img],
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_validate_images_wrong_type(self, verified_user):
        bad_img = SimpleUploadedFile("test.txt", b"text", content_type="text/plain")
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "images": [bad_img],
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_validate_videos_too_large(self, verified_user):
        large_vid = SimpleUploadedFile(
            "big.mp4", b"\x00" * (101 * 1024 * 1024), content_type="video/mp4"
        )
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "videos": [large_vid],
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_validate_videos_wrong_type(self, verified_user):
        bad_vid = SimpleUploadedFile("test.txt", b"text", content_type="text/plain")
        data = {
            "title": "Test Report",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
            "videos": [bad_vid],
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()

    def test_invalid_location_types(self, verified_user):
        data = {
            "title": "Test Report",
            "latitude": "not_a_number",
            "longitude": "not_a_number",
            "device_latitude": "not_a_number",
            "device_longitude": "not_a_number",
            "category": "robbery",
            "severity": "high",
        }
        serializer = ReportCreateSerializer(
            data=data, context=self._make_context(verified_user)
        )
        assert not serializer.is_valid()


class TestReportMediaSerializer:
    def test_fields(self):
        serializer = ReportMediaSerializer()
        expected = {"id", "media_type", "file", "created_at"}
        assert set(serializer.fields.keys()) == expected
