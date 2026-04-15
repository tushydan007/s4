from django.contrib import admin

from .models import SecurityStation


@admin.register(SecurityStation)
class SecurityStationAdmin(admin.ModelAdmin):
    list_display = ["name", "station_type", "latitude", "longitude", "is_active"]
    list_filter = ["station_type", "is_active"]
    search_fields = ["name", "address"]
