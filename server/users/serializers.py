import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "nin",
            "password",
            "password_confirm",
        ]

    def validate_nin(self, value: str) -> str:
        if not re.match(r"^\d{11}$", value):
            raise serializers.ValidationError("NIN must be exactly 11 digits.")
        if User.objects.filter(nin=value, nin_verified=True).exists():
            raise serializers.ValidationError("This NIN has already been registered.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = True
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TwoFactorVerifySerializer(serializers.Serializer):
    otp_code = serializers.CharField(max_length=6, min_length=6)
    temp_token = serializers.CharField()


class NINVerifySerializer(serializers.Serializer):
    nin = serializers.CharField(max_length=11, min_length=11)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)


class UserSerializer(serializers.ModelSerializer):
    is_fully_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "nin_verified",
            "email_verified",
            "two_factor_enabled",
            "is_fully_verified",
            "profile_picture",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "email",
            "nin_verified",
            "email_verified",
            "two_factor_enabled",
            "is_fully_verified",
            "date_joined",
        ]


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
