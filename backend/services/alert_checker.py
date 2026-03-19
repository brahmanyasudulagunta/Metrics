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
        logger.info(f"[Alert: {alert.name}] Querying: {alert.metric_query}")
        result = prom.query(alert.metric_query)
        
        # Check if we have results
        data = result.get("data", {}).get("result", [])
        logger.info(f"[Alert: {alert.name}] Raw result: {data}")
        
        # Determine firing status
        is_firing = False
        current_value = 0.0
        firing_labels = {}

        if data:
            # For simplicity, we take the most extreme value if multiple results exist
            for item in data:
                try:
                    val = float(item["value"][1])
                except (ValueError, IndexError):
                    logger.error(f"[Alert: {alert.name}] Could not parse value: {item.get('value')}")
                    continue

                match = False
                condition = alert.condition.lower().strip()
                
                # Evaluation logic supporting words and symbols
                if condition in ["above", ">"] and val > alert.threshold:
                    match = True
                elif condition in ["below", "<"] and val < alert.threshold:
                    match = True
                elif condition == ">=" and val >= alert.threshold:
                    match = True
                elif condition == "<=" and val <= alert.threshold:
                    match = True
                elif condition == "==" and val == alert.threshold:
                    match = True
                elif condition == "!=" and val != alert.threshold:
                    match = True
                
                if match:
                    is_firing = True
                    current_value = val 
                    firing_labels = item.get("metric", {})
                    logger.warning(f"[Alert: {alert.name}] MATCH: {val} {condition} {alert.threshold}")
                    break 

        # Update AlertRule state in the database
        alert.last_checked_at = datetime.utcnow()
        alert.is_firing = is_firing
        # Even if not firing, store the most recent value from data if available
        if is_firing:
            alert.last_value = current_value
        elif data:
            try:
                alert.last_value = float(data[0]["value"][1])
            except:
                pass
        
        if is_firing:
            # Ensure an active (unresolved) FiredAlert exists
            active_alert = db.query(FiredAlert).filter(
                FiredAlert.alert_rule_id == alert.id,
                FiredAlert.resolved_at == None
            ).first()

            if not active_alert:
                logger.warning(f"[Alert: {alert.name}] Creating NEW FiredAlert record.")
                alert.last_fired_at = datetime.utcnow()
                new_fired = FiredAlert(
                    alert_rule_id=alert.id,
                    alert_name=alert.name,
                    value=current_value,
                    threshold=alert.threshold,
                    condition=alert.condition,
                    labels=firing_labels,
                    is_acknowledged=False,
                    fired_at=datetime.utcnow()
                )
                db.add(new_fired)
            else:
                # Update existing active alert with latest value (optional but helpful)
                active_alert.value = current_value
                db.add(active_alert)
            
            alert.firing_details = firing_labels
        else:
            # Resolve any existing open alerts for this rule
            open_alerts = db.query(FiredAlert).filter(
                FiredAlert.alert_rule_id == alert.id,
                FiredAlert.resolved_at == None
            ).all()
            
            if open_alerts:
                logger.info(f"[Alert: {alert.name}] Resolving {len(open_alerts)} active records.")
                for open_alert in open_alerts:
                    open_alert.resolved_at = datetime.utcnow()
                    db.add(open_alert)
            
            alert.firing_details = {} 
        
        db.add(alert)
        db.commit()
            
    except Exception as e:
        logger.error(f"[Alert: {alert.name}] Critical error in evaluation: {e}")
        db.rollback()
