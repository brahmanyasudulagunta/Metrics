from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from services.port_forward import port_forward_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/metrics/notifications")
def get_notifications(current_user: str = Depends(get_current_user)):
    """
    Consolidated endpoint for all dashboard notifications.
    Currently includes active port forwards, but can be extended for system alerts,
    deployment warnings, etc.
    """
    try:
        # 1. Fetch active port forwards
        active_forwards = port_forward_manager.list_forwards()
        
        # 2. In the future, fetch other alerts here
        alerts = []
        
        # Construct unified response
        return {
            "forwards": active_forwards,
            "alerts": alerts
        }
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")
