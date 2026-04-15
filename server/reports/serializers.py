import math

from django.conf import settings
from rest_framework import serializers

from .models import Report, ReportMedia

NIGERIA_LAT_MIN, NIGERIA_LAT_MAX = 4.27, 13.90
NIGERIA_LNG_MIN, NIGERIA_LNG_MAX = 2.69, 14.68
MAX_REPORT_DISTANCE_KM = 5.0


def _to_radians(value: float) -> float:
    return (value * 3.141592653589793) / 180.0


def _distance_km(
    from_lat: float, from_lng: float, to_lat: float, to_lng: float
) -> float:
    earth_radius_km = 6371.0
    d_lat = _to_radians(to_lat - from_lat)
    d_lng = _to_radians(to_lng - from_lng)
    a = (math.sin(d_lat / 2) ** 2) + math.cos(_to_radians(from_lat)) * math.cos(
        _to_radians(to_lat)
    ) * (math.sin(d_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


def _is_within_nigeria(lat: float, lng: float) -> bool:
    return (
        NIGERIA_LAT_MIN <= lat <= NIGERIA_LAT_MAX
        and NIGERIA_LNG_MIN <= lng <= NIGERIA_LNG_MAX
    )


def _is_allowed_audio_type(content_type: str | None) -> bool:
    if not content_type:
        return False

    # Browsers often append parameters, e.g. audio/webm;codecs=opus.
    normalized = content_type.split(";", 1)[0].strip().lower()
    return normalized in settings.ALLOWED_AUDIO_TYPES


class ReportMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportMedia
        fields = ["id", "media_type", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class ReportSerializer(serializers.ModelSerializer):
    media = ReportMediaSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    severity_display = serializers.CharField(
        source="get_severity_display", read_only=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "title",
            "description",
            "voice_note",
            "latitude",
            "longitude",
            "category",
            "category_display",
            "severity",
            "severity_display",
            "is_active",
            "media",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_user_name(self, obj: Report) -> str:
        return f"{obj.user.first_name} {obj.user.last_name}"

    def validate_voice_note(self, value):
        if value.size > settings.MAX_VOICE_NOTE_SIZE:
            raise serializers.ValidationError(
                f"Voice note must be under {settings.MAX_VOICE_NOTE_SIZE // (1024 * 1024)}MB."
            )
        if not _is_allowed_audio_type(getattr(value, "content_type", None)):
            raise serializers.ValidationError(
                "Unsupported audio format. Use MP3, WAV, OGG, WebM, or M4A."
            )
        return value


class ReportCreateSerializer(serializers.ModelSerializer):
    device_latitude = serializers.FloatField(write_only=True)
    device_longitude = serializers.FloatField(write_only=True)
    images = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )
    videos = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )

    class Meta:
        model = Report
        fields = [
            "title",
            "description",
            "voice_note",
            "latitude",
            "longitude",
            "device_latitude",
            "device_longitude",
            "category",
            "severity",
            "images",
            "videos",
        ]

    def validate_voice_note(self, value):
        if value.size > settings.MAX_VOICE_NOTE_SIZE:
            raise serializers.ValidationError(
                f"Voice note must be under {settings.MAX_VOICE_NOTE_SIZE // (1024 * 1024)}MB."
            )
        if not _is_allowed_audio_type(getattr(value, "content_type", None)):
            raise serializers.ValidationError(
                "Unsupported audio format. Use MP3, WAV, OGG, WebM, or M4A."
            )
        return value

    def _validate_media_files(self, files, allowed_types, max_size, label):
        for f in files:
            if f.size > max_size:
                raise serializers.ValidationError(
                    f"{label} must be under {max_size // (1024 * 1024)}MB each."
                )
            if f.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Unsupported {label.lower()} format: {f.content_type}"
                )

    def validate_images(self, value):
        self._validate_media_files(
            value, settings.ALLOWED_IMAGE_TYPES, settings.MAX_IMAGE_SIZE, "Image"
        )
        return value

    def validate_videos(self, value):
        self._validate_media_files(
            value, settings.ALLOWED_VIDEO_TYPES, settings.MAX_VIDEO_SIZE, "Video"
        )
        return value

    def validate(self, attrs):
        """Require enabled device location and enforce nearby report posting."""
        try:
            lat = float(attrs.get("latitude"))
            lng = float(attrs.get("longitude"))
            device_lat = float(attrs.get("device_latitude"))
            device_lng = float(attrs.get("device_longitude"))
        except (TypeError, ValueError):
            raise serializers.ValidationError(
                {"location": "Invalid latitude or longitude."}
            )

        if not _is_within_nigeria(device_lat, device_lng):
            raise serializers.ValidationError(
                {
                    "device_location": "Device location must be within Nigeria to submit a report."
                }
            )

        if not _is_within_nigeria(lat, lng):
            raise serializers.ValidationError(
                {"location": "Reports must be submitted for locations within Nigeria."}
            )

        distance_km = _distance_km(device_lat, device_lng, lat, lng)
        if distance_km > MAX_REPORT_DISTANCE_KM:
            raise serializers.ValidationError(
                {
                    "location": (
                        f"Report location is too far from your current device location "
                        f"({distance_km:.1f}km). Move closer and try again."
                    )
                }
            )

        return attrs

    def create(self, validated_data: dict) -> Report:
        validated_data.pop("device_latitude", None)
        validated_data.pop("device_longitude", None)
        images = validated_data.pop("images", [])
        videos = validated_data.pop("videos", [])

        report = Report.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )

        media_objects = []
        for img in images:
            media_objects.append(
                ReportMedia(report=report, media_type="image", file=img)
            )
        for vid in videos:
            media_objects.append(
                ReportMedia(report=report, media_type="video", file=vid)
            )
        if media_objects:
            ReportMedia.objects.bulk_create(media_objects)

        return report
