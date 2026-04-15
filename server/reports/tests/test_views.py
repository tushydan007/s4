import pytest
from unittest.mock import patch, MagicMock
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

from reports.models import Report, ReportMedia


@pytest.mark.django_db
class TestReportListView:
    url = "/api/reports/"

    def test_list_public(self, api_client, report):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_filter_category(self, api_client, report):
        response = api_client.get(self.url, {"category": "robbery"})
        assert response.status_code == status.HTTP_200_OK
        for r in response.data["results"]:
            assert r["category"] == "robbery"

    def test_list_filter_category_no_match(self, api_client, report):
        response = api_client.get(self.url, {"category": "flooding"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_list_filter_bounding_box(self, api_client, report):
        response = api_client.get(
            self.url,
            {"min_lat": 8.0, "max_lat": 10.0, "min_lng": 6.0, "max_lng": 8.0},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_list_inactive_not_shown(self, api_client, report):
        report.is_active = False
        report.save()
        response = api_client.get(self.url)
        assert response.data["count"] == 0


@pytest.mark.django_db
class TestReportCreateView:
    url = "/api/reports/create/"

    @patch("reports.views.get_channel_layer")
    def test_create_success(
        self, mock_channel_layer, verified_auth_client, verified_user
    ):
        mock_layer = MagicMock()
        mock_channel_layer.return_value = mock_layer
        voice = SimpleUploadedFile(
            "voice.webm", b"\x00" * 1024, content_type="audio/webm"
        )
        data = {
            "title": "New Report",
            "description": "A test incident",
            "voice_note": voice,
            "latitude": 9.058,
            "longitude": 7.495,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
        }
        response = verified_auth_client.post(self.url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Report"

    def test_create_unauthenticated(self, api_client):
        response = api_client.post(self.url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_unverified_user(self, auth_client):
        voice = SimpleUploadedFile(
            "voice.webm", b"\x00" * 1024, content_type="audio/webm"
        )
        data = {
            "title": "New Report",
            "voice_note": voice,
            "latitude": 9.058,
            "longitude": 7.495,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "high",
        }
        response = auth_client.post(self.url, data, format="multipart")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch("reports.views.get_channel_layer")
    def test_create_with_images(self, mock_channel_layer, verified_auth_client):
        mock_layer = MagicMock()
        mock_channel_layer.return_value = mock_layer
        voice = SimpleUploadedFile(
            "voice.webm", b"\x00" * 1024, content_type="audio/webm"
        )
        img = SimpleUploadedFile(
            "photo.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 100, content_type="image/jpeg"
        )
        data = {
            "title": "Report with Image",
            "voice_note": voice,
            "latitude": 9.058,
            "longitude": 7.495,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "fire",
            "severity": "critical",
            "images": [img],
        }
        response = verified_auth_client.post(self.url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED

    @patch("reports.views.get_channel_layer", side_effect=Exception("channel error"))
    def test_create_websocket_failure_still_succeeds(
        self, mock_cl, verified_auth_client
    ):
        voice = SimpleUploadedFile(
            "voice.webm", b"\x00" * 1024, content_type="audio/webm"
        )
        data = {
            "title": "WS Fail Report",
            "voice_note": voice,
            "latitude": 9.058,
            "longitude": 7.495,
            "device_latitude": 9.058,
            "device_longitude": 7.495,
            "category": "robbery",
            "severity": "low",
        }
        response = verified_auth_client.post(self.url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestReportDetailView:
    def test_get_report(self, auth_client, report):
        response = auth_client.get(f"/api/reports/{report.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == report.title

    def test_delete_own_report(self, verified_auth_client, report, verified_user):
        assert report.user == verified_user
        response = verified_auth_client.delete(f"/api/reports/{report.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        report.refresh_from_db()
        assert not report.is_active

    def test_delete_other_user_report(self, auth_client, report):
        # auth_client uses 'user' fixture, report belongs to 'verified_user'
        response = auth_client.delete(f"/api/reports/{report.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_unauthenticated(self, api_client, report):
        response = api_client.get(f"/api/reports/{report.id}/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_with_media(self, verified_auth_client, report):
        ReportMedia.objects.create(report=report, media_type="image")
        response = verified_auth_client.delete(f"/api/reports/{report.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestUserReportsView:
    url = "/api/reports/my-reports/"

    def test_list_own_reports(self, verified_auth_client, report):
        response = verified_auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
