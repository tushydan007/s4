import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    if created:
        logger.info(f"New user registered: {instance.email}")
