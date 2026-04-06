from django.conf import settings
from rest_framework import serializers

from .models import Report, ReportMedia


def _is_allowed_audio_type(content_type: str | None) -> bool:
    if not content_type:
        return False

    # Browsers often append parameters, e.g. audio/webm;codecs=opus.
    normalized = content_type.split(';', 1)[0].strip().lower()
    return normalized in settings.ALLOWED_AUDIO_TYPES


class ReportMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportMedia
        fields = ['id', 'media_type', 'file', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    media = ReportMediaSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    severity_display = serializers.CharField(
        source='get_severity_display', read_only=True
    )

    class Meta:
        model = Report
        fields = [
            'id', 'user', 'user_email', 'user_name', 'title', 'description',
            'voice_note', 'latitude', 'longitude', 'category', 'category_display',
            'severity', 'severity_display', 'is_active', 'media',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_user_name(self, obj: Report) -> str:
        return f"{obj.user.first_name} {obj.user.last_name}"

    def validate_voice_note(self, value):
        if value.size > settings.MAX_VOICE_NOTE_SIZE:
            raise serializers.ValidationError(
                f'Voice note must be under {settings.MAX_VOICE_NOTE_SIZE // (1024 * 1024)}MB.'
            )
        if not _is_allowed_audio_type(getattr(value, 'content_type', None)):
            raise serializers.ValidationError(
                'Unsupported audio format. Use MP3, WAV, OGG, WebM, or M4A.'
            )
        return value


class ReportCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )
    videos = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )

    class Meta:
        model = Report
        fields = [
            'title', 'description', 'voice_note', 'latitude', 'longitude',
            'category', 'severity', 'images', 'videos',
        ]

    def validate_voice_note(self, value):
        if value.size > settings.MAX_VOICE_NOTE_SIZE:
            raise serializers.ValidationError(
                f'Voice note must be under {settings.MAX_VOICE_NOTE_SIZE // (1024 * 1024)}MB.'
            )
        if not _is_allowed_audio_type(getattr(value, 'content_type', None)):
            raise serializers.ValidationError(
                'Unsupported audio format. Use MP3, WAV, OGG, WebM, or M4A.'
            )
        return value

    def _validate_media_files(self, files, allowed_types, max_size, label):
        for f in files:
            if f.size > max_size:
                raise serializers.ValidationError(
                    f'{label} must be under {max_size // (1024 * 1024)}MB each.'
                )
            if f.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f'Unsupported {label.lower()} format: {f.content_type}'
                )

    def validate_images(self, value):
        self._validate_media_files(
            value, settings.ALLOWED_IMAGE_TYPES, settings.MAX_IMAGE_SIZE, 'Image'
        )
        return value

    def validate_videos(self, value):
        self._validate_media_files(
            value, settings.ALLOWED_VIDEO_TYPES, settings.MAX_VIDEO_SIZE, 'Video'
        )
        return value

    def validate(self, attrs):
        """Enforce that reported locations are within Nigeria's geographic bounds."""
        NIGERIA_LAT_MIN, NIGERIA_LAT_MAX = 4.27, 13.90
        NIGERIA_LNG_MIN, NIGERIA_LNG_MAX = 2.69, 14.68
        try:
            lat = float(attrs.get('latitude', 0))
            lng = float(attrs.get('longitude', 0))
        except (TypeError, ValueError):
            raise serializers.ValidationError(
                {'location': 'Invalid latitude or longitude.'}
            )
        if not (
            NIGERIA_LAT_MIN <= lat <= NIGERIA_LAT_MAX
            and NIGERIA_LNG_MIN <= lng <= NIGERIA_LNG_MAX
        ):
            raise serializers.ValidationError(
                {'location': 'Reports must be submitted for locations within Nigeria.'}
            )
        return attrs

    def create(self, validated_data: dict) -> Report:
        images = validated_data.pop('images', [])
        videos = validated_data.pop('videos', [])

        report = Report.objects.create(
            user=self.context['request'].user,
            **validated_data,
        )

        media_objects = []
        for img in images:
            media_objects.append(
                ReportMedia(report=report, media_type='image', file=img)
            )
        for vid in videos:
            media_objects.append(
                ReportMedia(report=report, media_type='video', file=vid)
            )
        if media_objects:
            ReportMedia.objects.bulk_create(media_objects)

        return report
