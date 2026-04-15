import pytest
from rest_framework import status
from stations.models import SecurityStation


@pytest.mark.django_db
class TestStationListView:
    url = "/api/stations/"

    def test_list_public(self, api_client, station):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_filter_type(self, api_client, station):
        response = api_client.get(self.url, {"type": "police"})
        assert response.status_code == status.HTTP_200_OK
        for s in response.data:
            assert s["station_type"] == "police"

    def test_list_filter_type_no_match(self, api_client, station):
        response = api_client.get(self.url, {"type": "navy"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_inactive_not_shown(self, api_client, station):
        station.is_active = False
        station.save()
        response = api_client.get(self.url)
        assert len(response.data) == 0


@pytest.mark.django_db
class TestNearestStationsView:
    url = "/api/stations/nearest/"

    def test_nearest_success(self, auth_client, station):
        response = auth_client.get(self.url, {"lat": 9.06, "lng": 7.50})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert "distance_km" in response.data[0]

    def test_nearest_with_params(self, auth_client, station):
        response = auth_client.get(
            self.url, {"lat": 9.06, "lng": 7.50, "radius": 100, "limit": 5}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_nearest_no_results(self, auth_client, station):
        response = auth_client.get(self.url, {"lat": 0.0, "lng": 0.0, "radius": 1})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_nearest_missing_params(self, auth_client):
        response = auth_client.get(self.url)
        assert response.status_code == 400

    def test_nearest_invalid_params(self, auth_client):
        response = auth_client.get(self.url, {"lat": "abc", "lng": "xyz"})
        assert response.status_code == 400

    def test_nearest_unauthenticated(self, api_client):
        response = api_client.get(self.url, {"lat": 9.06, "lng": 7.50})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_haversine_static_method(self):
        from stations.views import NearestStationsView

        d = NearestStationsView._haversine(9.06, 7.50, 9.06, 7.50)
        assert d == 0.0
