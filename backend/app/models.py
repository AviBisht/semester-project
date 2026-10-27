from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="operator")  # operator, admin
    created_at = Column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(20), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False)  # Flooding/Waterlogging, Fire, Road Accident, Medical Emergency, Road Blockage, Other
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    people_affected = Column(Integer, default=0)
    vulnerable_involved = Column(Boolean, default=False)
    severity = Column(Integer, default=1)  # 1 to 5
    photo_url = Column(String(255), nullable=True)
    
    priority_score = Column(Integer, default=0)
    priority_level = Column(String(20), default="Low")  # Critical, High, Medium, Low
    score_breakdown = Column(Text, nullable=True)  # JSON-encoded string of scoring parts

    # Status: Reported -> Assigned -> In Progress -> Resolved, or Rejected
    status = Column(String(20), default="Reported", index=True)
    
    is_verified = Column(Boolean, default=False, index=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="incident", cascade="all, delete-orphan")
    updates = relationship("IncidentUpdate", back_populates="incident", order_by="IncidentUpdate.created_at.desc()", cascade="all, delete-orphan")
    alert = relationship("EmergencyAlert", back_populates="incident", uselist=False, cascade="all, delete-orphan")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # ambulance, fire unit, rescue team
    status = Column(String(20), default="Available", index=True)  # Available, Assigned, Busy
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="resource")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="Active")  # Active, Completed, Cancelled

    incident = relationship("Incident", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(String(50), default="Operator")
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="updates")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_token = Column(String(64), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0, nullable=False)
    location_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Web Push Credentials (optional - stored only if citizen grants browser push permission)
    push_endpoint = Column(Text, nullable=True)
    push_p256dh = Column(Text, nullable=True)
    push_auth = Column(Text, nullable=True)

    consent_given_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dispatches = relationship("AlertDispatchLog", back_populates="subscription", cascade="all, delete-orphan")


class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), unique=True, nullable=False, index=True)
    approved_by = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(Integer, default=1)
    priority_level = Column(String(20), default="Low")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    approx_location = Column(String(255), nullable=True)  # Anonymized / generalized public locality
    title = Column(String(255), nullable=False)
    safety_instructions = Column(Text, nullable=True)
    dispatched_subscribers_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="alert")
    dispatches = relationship("AlertDispatchLog", back_populates="alert", cascade="all, delete-orphan")


class AlertDispatchLog(Base):
    __tablename__ = "alert_dispatch_logs"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("emergency_alerts.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("alert_subscriptions.id"), nullable=False, index=True)
    distance_km = Column(Float, nullable=False)
    delivery_channel = Column(String(20), default="in-app")  # in-app, web-push
    delivery_status = Column(String(20), default="Delivered")  # Delivered, Failed
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("EmergencyAlert", back_populates="dispatches")
    subscription = relationship("AlertSubscription", back_populates="dispatches")
