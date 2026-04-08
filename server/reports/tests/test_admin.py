import pytest
from django.contrib.admin.sites import AdminSite
from reports.admin import ReportAdmin
from reports.models import Report


@pytest.mark.django_db
class TestReportAdmin:
    def test_list_display(self):
        admin = ReportAdmin(Report, AdminSite())
        assert "title" in admin.list_display
        assert "category" in admin.list_display
        assert "severity" in admin.list_display

    def test_list_filter(self):
        admin = ReportAdmin(Report, AdminSite())
        assert "category" in admin.list_filter
        assert "severity" in admin.list_filter

    def test_search_fields(self):
        admin = ReportAdmin(Report, AdminSite())
        assert "title" in admin.search_fields
