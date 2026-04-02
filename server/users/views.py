import io
import logging
import secrets
import uuid
from datetime import timedelta

import pyotp
import qrcode
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from .models import EmailVerificationToken, User
from .serializers import (
    LoginSerializer,
    NINVerifySerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    TwoFactorVerifySerializer,
    UserSerializer,
)
from .utils import send_verification_email, verify_nin_with_smileid

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """Register a new user, verify NIN via SmileID, and send verification email."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nin = serializer.validated_data.get('nin', '').strip()
        first_name = serializer.validated_data.get('first_name', '').strip()
        last_name = serializer.validated_data.get('last_name', '').strip()

        if nin:
            nin_result = verify_nin_with_smileid(
                user_id=str(uuid.uuid4()),
                nin=nin,
                first_name=first_name,
                last_name=last_name,
            )
            if not nin_result['success']:
                return Response(
                    {'nin': [nin_result.get('message', 'NIN verification failed. Please check your NIN and try again.')]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user = serializer.save()

        if nin:
            user.nin_verified = True
            user.save(update_fields=['nin_verified'])

        send_verification_email(user)

        return Response(
            {
                'message': 'Registration successful. Please check your email to verify your account.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PreRegisterNINVerifyView(APIView):
    """Verify NIN before registration (no authentication required)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        nin = request.data.get('nin', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()

        if not nin or not first_name or not last_name:
            return Response(
                {'error': 'NIN, first name, and last name are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (nin.isdigit() and len(nin) == 11):
            return Response(
                {'error': 'NIN must be exactly 11 digits.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = verify_nin_with_smileid(
            user_id=str(uuid.uuid4()),
            nin=nin,
            first_name=first_name,
            last_name=last_name,
        )

        if result['success']:
            return Response({'verified': True, 'message': result.get('message', 'NIN verified.')})

        return Response(
            {'error': result.get('message', 'NIN verification failed. Please check your NIN.')},
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyEmailView(APIView):
    """Verify user email with token."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, token: str):
        try:
            verification = EmailVerificationToken.objects.select_related('user').get(
                id=token
            )
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Token was already used — if the user is verified treat this as success
        # so that refreshing the confirmation page does not show an error.
        if verification.is_used:
            if verification.user.email_verified:
                return Response({'message': 'Email already verified. You can now log in.'})
            return Response(
                {'error': 'This verification link has already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.is_expired:
            return Response(
                {'error': 'Verification link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.is_used = True
        verification.save(update_fields=['is_used'])
        verification.user.email_verified = True
        verification.user.save(update_fields=['email_verified'])

        return Response({'message': 'Email verified successfully.'})


class ResendVerificationView(APIView):
    """Resend verification email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response({'message': 'If this email exists, a verification link has been sent.'})

        if user.email_verified:
            return Response({'message': 'Email is already verified.'})

        send_verification_email(user)
        return Response({'message': 'If this email exists, a verification link has been sent.'})


class LoginView(APIView):
    """Login with email and password. Handles 2FA flow."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.email_verified:
            return Response(
                {'error': 'Please verify your email before logging in.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Always require email OTP — generate a 6-digit code and send it
        otp_code = str(secrets.randbelow(10 ** 6)).zfill(6)
        temp_token = str(AccessToken.for_user(user))
        cache_key = f'login_email_otp_{user.id}'
        cache.set(cache_key, otp_code, timeout=300)  # 5-minute TTL

        try:
            send_mail(
                subject='S4 Security – Your Login Verification Code',
                message=(
                    f'Hello {user.first_name},\n\n'
                    f'Your one-time login code is: {otp_code}\n\n'
                    f'This code expires in 5 minutes.\n\n'
                    f'If you did not request this, please ignore this email.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error('Failed to send login OTP to %s: %s', user.email, exc)
            cache.delete(cache_key)
            return Response(
                {'error': 'Failed to send verification code. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'requires_2fa': True,
            'temp_token': temp_token,
            'message': 'A verification code has been sent to your email.',
        })


class TwoFactorSetupView(APIView):
    """Generate TOTP secret and QR code for 2FA setup."""

    def get(self, request):
        user = request.user
        if user.two_factor_enabled:
            return Response(
                {'error': '2FA is already enabled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save(update_fields=['two_factor_secret'])

        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email, issuer_name='S4 Security'
        )

        qr = qrcode.make(provisioning_uri)
        buffer = io.BytesIO()
        qr.save(buffer, format='PNG')
        import base64
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_base64}',
            'provisioning_uri': provisioning_uri,
        })

    def post(self, request):
        """Verify initial 2FA setup with OTP code."""
        otp_code = request.data.get('otp_code', '')
        user = request.user

        if not user.two_factor_secret:
            return Response(
                {'error': 'Please initiate 2FA setup first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(otp_code, valid_window=1):
            return Response(
                {'error': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.two_factor_enabled = True
        user.save(update_fields=['two_factor_enabled'])

        return Response({'message': '2FA has been enabled successfully.'})


class TwoFactorVerifyView(APIView):
    """Verify 2FA OTP code during login."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = AccessToken(serializer.validated_data['temp_token'])
            user = User.objects.get(id=token['user_id'])
        except Exception:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(serializer.validated_data['otp_code'], valid_window=1):
            return Response(
                {'error': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LoginEmailOTPVerifyView(APIView):
    """Verify the email OTP sent during login and issue full tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = AccessToken(serializer.validated_data['temp_token'])
            user_id = token['user_id']
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {'error': 'Invalid or expired session. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        cache_key = f'login_email_otp_{user_id}'
        stored_otp = cache.get(cache_key)

        if not stored_otp:
            return Response(
                {'error': 'Verification code has expired. Please log in again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if serializer.validated_data['otp_code'] != stored_otp:
            return Response(
                {'error': 'Invalid verification code. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache.delete(cache_key)  # Single-use – prevent replay

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class TwoFactorDisableView(APIView):
    """Disable 2FA for the current user."""

    def post(self, request):
        otp_code = request.data.get('otp_code', '')
        user = request.user

        if not user.two_factor_enabled:
            return Response(
                {'error': '2FA is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(otp_code, valid_window=1):
            return Response(
                {'error': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.two_factor_enabled = False
        user.two_factor_secret = ''
        user.save(update_fields=['two_factor_enabled', 'two_factor_secret'])

        return Response({'message': '2FA has been disabled.'})


class NINVerifyView(APIView):
    """Verify user NIN via SmileID."""

    def post(self, request):
        serializer = NINVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if user.nin_verified:
            return Response(
                {'error': 'NIN is already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nin = serializer.validated_data['nin']
        first_name = serializer.validated_data['first_name']
        last_name = serializer.validated_data['last_name']

        result = verify_nin_with_smileid(
            user_id=str(user.id),
            nin=nin,
            first_name=first_name,
            last_name=last_name,
        )

        if result['success']:
            user.nin = nin
            user.nin_verified = True
            user.save(update_fields=['nin', 'nin_verified'])
            return Response({
                'message': 'NIN verified successfully.',
                'verified': True,
            })

        return Response(
            {
                'error': result.get('message', 'NIN verification failed.'),
                'verified': False,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """Blacklist the refresh token on logout."""

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {'error': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'message': 'Logged out successfully.'})
