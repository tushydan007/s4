import pytest
from django.contrib.admin.sites import AdminSite
from stations.admin import SecurityStationAdmin
from stations.models import SecurityStation


@pytest.mark.django_db
class TestSecurityStationAdmin:
    def test_list_display(self):
        admin = SecurityStationAdmin(SecurityStation, AdminSite())
        assert "name" in admin.list_display
        assert "station_type" in admin.list_display

    def test_list_filter(self):
        admin = SecurityStationAdmin(SecurityStation, AdminSite())
        assert "station_type" in admin.list_filter

    def test_search_fields(self):
        admin = SecurityStationAdmin(SecurityStation, AdminSite())
        assert "name" in admin.search_fields
