import logging
import uuid

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import EmailVerificationToken

logger = logging.getLogger(__name__)


def send_verification_email(user) -> None:
    """Send email verification link to user."""
    # Invalidate any existing tokens
    EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

    token = EmailVerificationToken.objects.create(
        user=user,
        expires_at=timezone.now() + timezone.timedelta(hours=24),
    )

    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token.id}"

    subject = 'S4 Security - Verify Your Email'
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2439 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">S4 Security</h1>
            <p style="color: #94a3b8; margin-top: 5px;">Secure • Swift • Smart • Safe</p>
        </div>
        <div style="padding: 30px 0;">
            <h2 style="color: #1e3a5f;">Verify Your Email Address</h2>
            <p style="color: #334155; line-height: 1.6;">
                Hello {user.first_name},<br><br>
                Thank you for registering with S4 Security. Please click the button below
                to verify your email address and activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}"
                   style="background: #1e3a5f; color: #ffffff; padding: 14px 32px;
                          text-decoration: none; border-radius: 8px; font-weight: bold;
                          display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
                This link will expire in 24 hours. If you did not create an account,
                you can safely ignore this email.
            </p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px;">
                &copy; S4 Security Platform. Protecting lives and properties.
            </p>
        </div>
    </body>
    </html>
    """

    send_mail(
        subject=subject,
        message=strip_tags(html_message),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
    logger.info(f"Verification email sent to {user.email}")


def verify_nin_with_smileid(
    user_id: str, nin: str, first_name: str, last_name: str
) -> dict:
    """
    Verify NIN using SmileID Enhanced KYC API.
    Returns dict with 'success' boolean and optional 'message'.
    """
    partner_id = settings.SMILE_ID_PARTNER_ID
    api_key = settings.SMILE_ID_API_KEY
    sid_server = settings.SMILE_ID_SID_SERVER

    # Development/sandbox mode - if no credentials configured, use mock
    if not partner_id or not api_key:
        logger.warning("SmileID credentials not configured. Using mock verification.")
        # In development, verify if NIN format is valid (11 digits)
        if len(nin) == 11 and nin.isdigit():
            return {'success': True, 'message': 'NIN verified (development mode).'}
        return {'success': False, 'message': 'Invalid NIN format.'}

    try:
        from smile_id_core import IdApi

        id_api = IdApi(partner_id, api_key, sid_server)

        partner_params = {
            'user_id': user_id,
            'job_id': str(uuid.uuid4()),
            'job_type': 5,  # Enhanced KYC
        }

        id_info = {
            'country': 'NG',
            'id_type': 'NIN',
            'id_number': nin,
            'first_name': first_name,
            'last_name': last_name,
        }

        result = id_api.submit_job(partner_params, id_info)

        result_code = result.get('ResultCode', '')
        actions = result.get('Actions', {})
        id_verified = actions.get('Verify_ID_Number', '') == 'Verified'

        if result_code == '1012' and id_verified:
            return {'success': True, 'message': 'NIN verified successfully.'}

        return {
            'success': False,
            'message': f"NIN verification failed: {result.get('ResultText', 'Unknown error')}",
        }

    except ImportError:
        logger.error("smile-id-core package not installed.")
        return {'success': False, 'message': 'Verification service unavailable.'}
    except Exception as e:
        logger.error(f"SmileID verification error: {e}")
        return {'success': False, 'message': 'Verification service error. Please try again later.'}
