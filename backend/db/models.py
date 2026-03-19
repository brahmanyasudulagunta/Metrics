from sqlalchemy import Column, Integer, String, Boolean, Float, JSON, DateTime
from datetime import datetime
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    must_change_password = Column(Boolean, default=True)

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    metric_query = Column(String)
    threshold = Column(Float)
    condition = Column(String, default="above") # 'above', 'below'
    duration = Column(String, default="1m") # e.g. '5m'
    severity = Column(String, default="warning") # 'info', 'warning', 'critical'
    notification_channels = Column(JSON, default=[]) # e.g. ["email", "slack", "webhook"]
    is_enabled = Column(Boolean, default=True)
    is_firing = Column(Boolean, default=False)
    last_value = Column(Float, nullable=True)
    last_fired_at = Column(DateTime, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    firing_details = Column(JSON, default={}, nullable=False) # Store labels/summary of firing instances
    created_at = Column(DateTime, default=datetime.utcnow)

class FiredAlert(Base):
    __tablename__ = "fired_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_rule_id = Column(Integer)
    alert_name = Column(String)
    value = Column(Float)
    threshold = Column(Float)
    condition = Column(String)
    labels = Column(JSON)
    is_acknowledged = Column(Boolean, default=False)
    fired_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class ActionLog(Base):
    __tablename__ = "action_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String)
    action_type = Column(String) # CREATE, DELETE, RESTART, SCALE
    resource_type = Column(String) # Namespace, Pod, Deployment
    resource_name = Column(String)
    namespace = Column(String, nullable=True)
    details = Column(String, nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
