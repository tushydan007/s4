from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    """Allow access only to email-verified users."""

    message = 'Email verification is required.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.email_verified
        )


class IsNINVerified(BasePermission):
    """Allow access only to NIN-verified users."""

    message = 'NIN verification is required to use this feature.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.nin_verified
        )


class IsFullyVerified(BasePermission):
    """Allow access only to users with both email and NIN verified."""

    message = 'Full verification (email and NIN) is required.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.email_verified
            and request.user.nin_verified
        )
