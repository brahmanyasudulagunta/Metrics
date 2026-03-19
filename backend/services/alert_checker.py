import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import AlertRule, FiredAlert
from services.prometheus_client import PromClient

logger = logging.getLogger(__name__)
# Simple check logic - using a global instance of PromClient
prom = PromClient()

async def check_alerts_loop():
    """Background loop to check alerts periodically."""
    while True:
        try:
            with SessionLocal() as db:
                alerts = db.query(AlertRule).filter(AlertRule.is_enabled == True).all()
                for alert in alerts:
                    await evaluate_alert(alert, db)
                db.commit()
        except Exception as e:
            logger.error(f"Error in alert checker loop: {e}")
        await asyncio.sleep(60) # Check every minute

async def evaluate_alert(alert: AlertRule, db: Session):
    """Evaluate a single alert rule and update its firing status."""
    try:
        # Simple query - Prometheus returns current value for scalar queries
        result = prom.query(alert.metric_query)
        
        # Check if we have results
        data = result.get("data", {}).get("result", [])
        
        # Determine firing status
        is_firing = False
        current_value = 0.0
        firing_labels = {}

        if data:
            # For simplicity, we take the most extreme value if multiple results exist
            for item in data:
                val = float(item["value"][1])
                match = False
                if alert.condition == "above" and val > alert.threshold:
                    match = True
                elif alert.condition == "below" and val < alert.threshold:
                    match = True
                
                if match:
                    is_firing = True
                    current_value = val 
                    firing_labels = item.get("metric", {})
                    break 

        # Update AlertRule state in the database
        alert.last_checked_at = datetime.utcnow()
        was_firing = alert.is_firing
        alert.is_firing = is_firing
        alert.last_value = current_value if is_firing else (float(data[0]["value"][1]) if data else None)
        
        if is_firing:
            # Lifecycle: Check for existing open alert
            if not was_firing:
                alert.last_fired_at = datetime.utcnow()
                # Create a new FiredAlert entry
                new_fired = FiredAlert(
                    alert_rule_id=alert.id,
                    alert_name=alert.name,
                    value=current_value,
                    threshold=alert.threshold,
                    condition=alert.condition,
                    labels=firing_labels,
                    fired_at=datetime.utcnow()
                )
                db.add(new_fired)
            alert.firing_details = firing_labels
            logger.warning(f"ALERT FIRING: {alert.name} - Val: {current_value} Threshold: {alert.threshold}")
        else:
            # Lifecycle: Resolve existing open alert
            if was_firing:
                open_alert = db.query(FiredAlert).filter(
                    FiredAlert.alert_rule_id == alert.id,
                    FiredAlert.resolved_at == None
                ).first()
                if open_alert:
                    open_alert.resolved_at = datetime.utcnow()
                    db.add(open_alert)
            alert.firing_details = {} 
        
        db.add(alert)
        db.commit()
            
    except Exception as e:
        logger.error(f"Error evaluating alert {alert.name}: {e}")
        db.rollback()
