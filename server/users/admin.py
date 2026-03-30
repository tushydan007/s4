from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailVerificationToken, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'username', 'first_name', 'last_name',
        'email_verified', 'nin_verified', 'two_factor_enabled',
        'is_active', 'date_joined',
    ]
    list_filter = [
        'email_verified', 'nin_verified', 'two_factor_enabled',
        'is_active', 'is_staff',
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Verification', {
            'fields': (
                'phone_number', 'nin', 'nin_verified',
                'email_verified', 'two_factor_enabled', 'profile_picture',
            ),
        }),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at']
