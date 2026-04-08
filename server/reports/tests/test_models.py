import pytest
from reports.models import Report, ReportMedia
from users.models import User


@pytest.mark.django_db
class TestReportModel:
    def test_create_report(self, verified_user):
        report = Report.objects.create(
            user=verified_user,
            title="Test Report",
            description="Test description",
            latitude=9.0579,
            longitude=7.4951,
            category="robbery",
            severity="high",
        )
        assert str(report) == "Test Report — Robbery"
        assert report.is_active
        assert report.category == "robbery"
        assert report.severity == "high"

    def test_report_ordering(self):
        assert Report._meta.ordering == ["-created_at"]

    def test_report_uuid_pk(self, report):
        import uuid
        assert isinstance(report.id, uuid.UUID)

    def test_report_default_category(self, verified_user):
        report = Report.objects.create(
            user=verified_user,
            title="Default Category",
            latitude=9.0579,
            longitude=7.4951,
        )
        assert report.category == "other"

    def test_report_default_severity(self, verified_user):
        report = Report.objects.create(
            user=verified_user,
            title="Default Severity",
            latitude=9.0579,
            longitude=7.4951,
        )
        assert report.severity == "medium"


@pytest.mark.django_db
class TestReportMediaModel:
    def test_create_media(self, report):
        media = ReportMedia.objects.create(
            report=report,
            media_type="image",
        )
        assert str(media) == f"Image for {report.title}"
        assert media.media_type == "image"

    def test_media_ordering(self):
        assert ReportMedia._meta.ordering == ["created_at"]

    def test_media_video_type(self, report):
        media = ReportMedia.objects.create(
            report=report,
            media_type="video",
        )
        assert str(media) == f"Video for {report.title}"
