import pytest
from stations.models import SecurityStation


@pytest.mark.django_db
class TestSecurityStationModel:
    def test_create_station(self, station):
        assert station.name == "Test Police Station"
        assert station.station_type == "police"
        assert station.is_active is True

    def test_station_str(self, station):
        assert str(station) == "Test Police Station (Police Station)"

    def test_station_ordering(self):
        assert SecurityStation._meta.ordering == ["name"]

    def test_station_uuid_pk(self, station):
        import uuid

        assert isinstance(station.id, uuid.UUID)

    def test_station_types(self):
        types = dict(SecurityStation.STATION_TYPE_CHOICES)
        assert "police" in types
        assert "army" in types
        assert "fire" in types
        assert "navy" in types
        assert "civil_defense" in types
        assert "military" in types
