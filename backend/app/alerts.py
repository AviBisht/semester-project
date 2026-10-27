import os
import json
import secrets
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger("dects.alerts")

DEFAULT_SAFETY_INSTRUCTIONS: Dict[str, str] = {
    "Flooding/Waterlogging": (
        "Move to higher ground immediately. Avoid walking, cycling, or driving through flood waters "
        "or active riverbanks (Rispana, Bindal). Stay clear of submerged electrical infrastructure. "
        "Contact DEOC helpline 1077 / 112 for rescue extraction."
    ),
    "Fire": (
        "Evacuate the immediate hazard perimeter immediately. Keep low under smoke and do not use elevators. "
        "Keep municipal roadways clear for incoming fire rescue tenders and water tankers."
    ),
    "Road Accident": (
        "Do not crowd the accident site. Maintain a clear corridor for emergency ambulances. "
        "Follow traffic police diversions and exercise caution in low-visibility sectors."
    ),
    "Medical Emergency": (
        "Keep transit lanes open for approaching paramedics. Follow instructions from emergency dispatchers "
        "and avoid crowding the site."
    ),
    "Road Blockage": (
        "Roadway blocked. Do not proceed into the affected mountain cut or intersection. "
        "Take authorized municipal detours. Avoid hillsides prone to secondary rockfall."
    ),
    "Other": (
        "Follow official directives issued by the Dehradun District Disaster Management Authority (DDMA). "
        "Stay tuned to official municipal channels. Emergency Helpline: 112 / 1077."
    ),
}

def generate_subscriber_token() -> str:
    """Generate a cryptographically secure, unguessable 43-character URL-safe subscription token."""
    return secrets.token_urlsafe(32)

def get_default_safety_instructions(incident_type: str) -> str:
    """Return standard municipal public safety advisory based on verified incident category."""
    return DEFAULT_SAFETY_INSTRUCTIONS.get(incident_type, DEFAULT_SAFETY_INSTRUCTIONS["Other"])

def dispatch_web_push_notification(
    push_endpoint: str,
    p256dh: str,
    auth: str,
    payload: Dict[str, Any]
) -> bool:
    """
    Attempt Web Push delivery using pywebpush if VAPID credentials are configured in the environment.
    Falls back gracefully without crashing if unconfigured, logging the operational status.
    """
    vapid_private_key = os.environ.get("VAPID_PRIVATE_KEY")
    vapid_public_key = os.environ.get("VAPID_PUBLIC_KEY")
    vapid_claims_email = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:deoc-alerts@dehradun.gov.in")

    if not vapid_private_key or not vapid_public_key:
        logger.info(
            "[Web Push] VAPID keys (VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY) not present in environment. "
            "Alert delivered via persistent In-App notification channel."
        )
        return False

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.info(
            "[Web Push] 'pywebpush' library not installed in Python environment. "
            "Alert delivered via persistent In-App notification channel."
        )
        return False

    try:
        subscription_info = {
            "endpoint": push_endpoint,
            "keys": {
                "p256dh": p256dh,
                "auth": auth
            }
        }
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_claims_email}
        )
        logger.info(f"[Web Push] Successfully delivered push payload to {push_endpoint[:30]}...")
        return True
    except Exception as e:
        logger.warning(f"[Web Push] Push dispatch failed for subscriber endpoint: {e}")
        return False
