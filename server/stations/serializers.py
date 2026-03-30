from rest_framework import serializers

from .models import SecurityStation


class SecurityStationSerializer(serializers.ModelSerializer):
    station_type_display = serializers.CharField(
        source='get_station_type_display', read_only=True
    )

    class Meta:
        model = SecurityStation
        fields = [
            'id', 'name', 'station_type', 'station_type_display',
            'latitude', 'longitude', 'address', 'phone_number',
            'is_active', 'created_at',
        ]
