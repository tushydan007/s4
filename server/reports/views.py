import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from users.permissions import IsFullyVerified

from .models import Report
from .serializers import ReportCreateSerializer, ReportSerializer

logger = logging.getLogger(__name__)


class ReportListView(generics.ListAPIView):
    """List all active reports. Accessible to all authenticated users."""

    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Report.objects.filter(is_active=True).select_related('user').prefetch_related('media')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by bounding box for map viewport
        min_lat = self.request.query_params.get('min_lat')
        max_lat = self.request.query_params.get('max_lat')
        min_lng = self.request.query_params.get('min_lng')
        max_lng = self.request.query_params.get('max_lng')

        if all([min_lat, max_lat, min_lng, max_lng]):
            queryset = queryset.filter(
                latitude__gte=min_lat,
                latitude__lte=max_lat,
                longitude__gte=min_lng,
                longitude__lte=max_lng,
            )

        return queryset


class ReportCreateView(generics.CreateAPIView):
    """Create a new incident report. Requires full verification."""

    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsFullyVerified]
    # Disable DRF's default parser to handle multipart
    parser_classes = None  # Use default parsers including MultiPartParser

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from rest_framework.parsers import MultiPartParser, FormParser
        self.parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()

        # Broadcast to WebSocket
        response_data = ReportSerializer(report).data
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'reports',
                {
                    'type': 'report.new',
                    'report': response_data,
                },
            )
        except Exception as e:
            logger.warning(f"WebSocket broadcast failed: {e}")

        return Response(response_data, status=status.HTTP_201_CREATED)


class ReportDetailView(generics.RetrieveAPIView):
    """Retrieve a single report."""

    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(is_active=True).select_related('user').prefetch_related('media')


class UserReportsView(generics.ListAPIView):
    """List reports by the current user."""

    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Report.objects.filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('media')
        )
