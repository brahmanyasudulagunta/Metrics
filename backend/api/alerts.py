from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import SessionLocal
from db.models import AlertRule, FiredAlert
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AlertRuleBase(BaseModel):
    name: str
    metric_query: str
    threshold: float
    condition: str = "above"
    duration: str = "1m"
    severity: str = "warning"
    notification_channels: List[str] = []
    is_enabled: bool = True

class AlertRuleCreate(AlertRuleBase):
    pass

class AlertRuleUpdate(BaseModel):
    name: str = None
    metric_query: str = None
    threshold: float = None
    condition: str = None
    duration: str = None
    severity: str = None
    notification_channels: List[str] = None
    is_enabled: bool = None

class AlertRuleSchema(AlertRuleBase):
    id: int
    is_firing: bool
    last_value: Optional[float]
    last_fired_at: Optional[datetime]
    last_checked_at: Optional[datetime]
    firing_details: dict
    created_at: datetime

    class Config:
        from_attributes = True

class FiredAlertSchema(BaseModel):
    id: int
    alert_rule_id: int
    alert_name: str
    value: float
    threshold: float
    condition: str
    labels: dict
    is_acknowledged: bool
    fired_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.post("/alerts/acknowledge/{fired_alert_id}")
def acknowledge_alert(fired_alert_id: int, db: Session = Depends(get_db)):
    db_fired = db.query(FiredAlert).filter(FiredAlert.id == fired_alert_id).first()
    if not db_fired:
        raise HTTPException(status_code=404, detail="Fired alert not found")
    
    db_fired.is_acknowledged = True
    db.commit()
    return {"detail": "Alert acknowledged"}

@router.get("/alerts", response_model=List[AlertRuleSchema])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(AlertRule).all()

@router.get("/alerts/history", response_model=List[FiredAlertSchema])
def list_alert_history(db: Session = Depends(get_db), limit: int = 50):
    return db.query(FiredAlert).order_by(FiredAlert.fired_at.desc()).limit(limit).all()

@router.post("/alerts", response_model=AlertRuleSchema)
def create_alert(alert: AlertRuleCreate, db: Session = Depends(get_db)):
    db_alert = AlertRule(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.put("/alerts/{alert_id}", response_model=AlertRuleSchema)
def update_alert(alert_id: int, alert: AlertRuleUpdate, db: Session = Depends(get_db)):
    db_alert = db.query(AlertRule).filter(AlertRule.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    update_data = alert.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_alert, key, value)
    
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    db_alert = db.query(AlertRule).filter(AlertRule.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    db.delete(db_alert)
    db.commit()
    return {"detail": "Alert rule deleted"}
