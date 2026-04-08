import pytest
from users.models import User
from users.admin import UserAdmin
from django.contrib.admin.sites import AdminSite


@pytest.mark.django_db
class TestUserAdmin:
    def test_admin_list_display(self):
        admin = UserAdmin(User, AdminSite())
        assert "email" in admin.list_display
        assert "email_verified" in admin.list_display
        assert "nin_verified" in admin.list_display

    def test_admin_list_filter(self):
        admin = UserAdmin(User, AdminSite())
        assert "email_verified" in admin.list_filter
        assert "nin_verified" in admin.list_filter

    def test_admin_search_fields(self):
        admin = UserAdmin(User, AdminSite())
        assert "email" in admin.search_fields
