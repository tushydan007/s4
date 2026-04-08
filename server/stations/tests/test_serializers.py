import pytest
from stations.serializers import SecurityStationSerializer


@pytest.mark.django_db
class TestSecurityStationSerializer:
    def test_serializes_station(self, station):
        serializer = SecurityStationSerializer(station)
        data = serializer.data
        assert data["name"] == "Test Police Station"
        assert data["station_type"] == "police"
        assert data["station_type_display"] == "Police Station"
        assert "latitude" in data
        assert "longitude" in data
