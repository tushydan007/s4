from django.contrib import admin

from .models import Report, ReportMedia


class ReportMediaInline(admin.TabularInline):
    model = ReportMedia
    extra = 0
    readonly_fields = ["id", "created_at"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "category",
        "severity",
        "is_active",
        "created_at",
    ]
    list_filter = ["category", "severity", "is_active", "created_at"]
    search_fields = ["title", "description", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ReportMediaInline]
