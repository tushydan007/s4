import math

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SecurityStation
from .serializers import SecurityStationSerializer


class StationListView(generics.ListAPIView):
    """List all active security stations. Publicly accessible."""

    serializer_class = SecurityStationSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Return plain array – stations is a small finite dataset

    def get_queryset(self):
        queryset = SecurityStation.objects.filter(is_active=True)

        station_type = self.request.query_params.get("type")
        if station_type:
            queryset = queryset.filter(station_type=station_type)

        return queryset


class NearestStationsView(APIView):
    """Find nearest security stations to a given coordinate."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius_km = float(request.query_params.get("radius", 50))
        limit = int(request.query_params.get("limit", 10))

        if not lat or not lng:
            return Response(
                {"error": "lat and lng query parameters are required."},
                status=400,
            )

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid latitude or longitude values."},
                status=400,
            )

        stations = SecurityStation.objects.filter(is_active=True)

        # Calculate distance using Haversine formula and sort
        stations_with_distance = []
        for station in stations:
            distance = self._haversine(
                lat,
                lng,
                float(station.latitude),
                float(station.longitude),
            )
            if distance <= radius_km:
                stations_with_distance.append((station, distance))

        stations_with_distance.sort(key=lambda x: x[1])
        nearest = stations_with_distance[:limit]

        result = []
        for station, distance in nearest:
            data = SecurityStationSerializer(station).data
            data["distance_km"] = round(distance, 2)
            result.append(data)

        return Response(result)

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points on Earth in kilometers."""
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
