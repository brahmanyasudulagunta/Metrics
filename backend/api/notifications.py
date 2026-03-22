from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.database import SessionLocal, get_db
from db.models import AlertRule, FiredAlert, ActionLog
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/notifications/acknowledge-action/{action_id}")
def acknowledge_action(
    action_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an action log as acknowledged/dismissed."""
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action log not found")
    
    action.is_acknowledged = True
    db.commit()
    return {"status": "success"}

@router.get("/notifications")
def get_notifications(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Consolidated endpoint for all dashboard notifications.
    Includes active alerts and recent user actions.
    """
    try:
        # Fetch active alerts (not resolved and not acknowledged)
        active_fired = db.query(FiredAlert, AlertRule.severity).join(
            AlertRule, FiredAlert.alert_rule_id == AlertRule.id
        ).filter(
            FiredAlert.resolved_at == None,
            FiredAlert.is_acknowledged == False
        ).all()
        
        alerts = []
        for fired, severity in active_fired:
            alerts.append({
                "id": str(fired.id),
                "title": f"Alert: {fired.alert_name}",
                "message": f"Value {fired.value:.2f} {fired.condition} {fired.threshold}",
                "level": severity, # 'info', 'warning', 'critical'
                "fired_at": fired.fired_at.isoformat()
            })
        
        # Fetch recent actions (hidden which are already acknowledged)
        recent_actions = db.query(ActionLog).filter(
            ActionLog.is_acknowledged == False
        ).order_by(ActionLog.timestamp.desc()).limit(10).all()
        
        actions = []
        for a in recent_actions:
            actions.append({
                "id": str(a.id), # Use raw ID for easier acknowledge call
                "title": f"{a.action_type} {a.resource_type}",
                "message": f"{a.resource_name} in {a.namespace or 'cluster'} by {a.user_email}",
                "details": a.details,
                "timestamp": a.timestamp.isoformat()
            })
        
        # Construct unified response
        return {
            "alerts": alerts,
            "actions": actions
        }
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")
