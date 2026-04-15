import uuid

from django.conf import settings
from django.db import models


class Report(models.Model):
    CATEGORY_CHOICES = [
        ("robbery", "Robbery"),
        ("assault", "Assault"),
        ("fire", "Fire Outbreak"),
        ("accident", "Road Accident"),
        ("kidnapping", "Kidnapping"),
        ("terrorism", "Terrorism"),
        ("flooding", "Flooding"),
        ("suspicious", "Suspicious Activity"),
        ("gunshot", "Gunshots / Shooting"),
        ("vandalism", "Vandalism"),
        ("medical", "Medical Emergency"),
        ("other", "Other"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    voice_note = models.FileField(upload_to="voice_notes/%Y/%m/%d/")
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default="medium"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["category"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.get_category_display()}"


class ReportMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="media")
    media_type = models.CharField(max_length=5, choices=MEDIA_TYPE_CHOICES)
    file = models.FileField(upload_to="report_media/%Y/%m/%d/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.get_media_type_display()} for {self.report.title}"
