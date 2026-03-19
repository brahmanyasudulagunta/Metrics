from sqlalchemy.orm import Session
from .models import ActionLog
import logging

logger = logging.getLogger(__name__)

def log_action(
    db: Session,
    user_email: str,
    action_type: str,
    resource_type: str,
    resource_name: str,
    namespace: str = None,
    details: str = None
):
    try:
        new_log = ActionLog(
            user_email=user_email,
            action_type=action_type,
            resource_type=resource_type,
            resource_name=resource_name,
            namespace=namespace,
            details=details
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return new_log
    except Exception as e:
        logger.error(f"Failed to log action: {e}")
        db.rollback()
        return None
