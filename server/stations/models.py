import uuid

from django.db import models


class SecurityStation(models.Model):
    STATION_TYPE_CHOICES = [
        ('police', 'Police Station'),
        ('army', 'Army Barracks'),
        ('military', 'Military Base'),
        ('fire', 'Fire Station'),
        ('civil_defense', 'Civil Defense'),
        ('navy', 'Navy Base'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    station_type = models.CharField(max_length=20, choices=STATION_TYPE_CHOICES)
    latitude = models.DecimalField(max_digits=20, decimal_places=17)
    longitude = models.DecimalField(max_digits=20, decimal_places=17)
    address = models.TextField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['station_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_station_type_display()})"
