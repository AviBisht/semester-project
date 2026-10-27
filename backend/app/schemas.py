from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, description="Operator username")
    password: str = Field(..., min_length=1, max_length=256, description="Operator password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    type: str = Field(..., min_length=2, max_length=100)  # Flooding/Waterlogging, Fire, Road Accident, Medical Emergency, Road Blockage, Other
    description: str = Field(..., min_length=1, max_length=5000)
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude must be between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude must be between -180 and 180")
    people_affected: int = Field(default=0, ge=0, le=100000)
    vulnerable_involved: bool = False
    severity: int = Field(default=1, ge=1, le=5)
    photo_url: Optional[str] = Field(default=None, max_length=255)

class IncidentStatusUpdate(BaseModel):
    new_status: str = Field(..., pattern=r"^(Reported|Assigned|In Progress|Resolved|Rejected)$")
    comment: Optional[str] = Field(default=None, max_length=1000)

class IncidentAssignRequest(BaseModel):
    resource_id: int = Field(..., gt=0)
    comment: Optional[str] = Field(default=None, max_length=1000)

class IncidentUpdateLog(BaseModel):
    id: int
    incident_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResourceSchema(BaseModel):
    id: int
    name: str
    type: str  # ambulance, fire unit, rescue team
    status: str  # Available, Assigned, Busy
    latitude: float
    longitude: float
    contact_number: Optional[str] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: int
    tracking_id: str
    type: str
    description: str
    latitude: float
    longitude: float
    people_affected: int
    vulnerable_involved: bool
    severity: int
    photo_url: Optional[str] = None
    priority_score: int
    priority_level: str
    score_breakdown: Optional[str] = None
    status: str
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    updates: Optional[List[IncidentUpdateLog]] = []
    assigned_resources: Optional[List[ResourceSchema]] = []
    nearby_blockages: Optional[List[Any]] = []

    class Config:
        from_attributes = True

class PushSubscriptionKeys(BaseModel):
    p256dh: str = Field(..., min_length=1, max_length=255)
    auth: str = Field(..., min_length=1, max_length=255)

class PushSubscriptionPayload(BaseModel):
    endpoint: str = Field(..., min_length=5, max_length=2000)
    keys: PushSubscriptionKeys

class AlertSubscriptionCreate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")
    radius_km: float = Field(default=5.0, ge=0.5, le=50.0, description="Alert radius in kilometers (0.5km to 50km)")
    location_name: Optional[str] = Field(default=None, max_length=255)
    consent: bool = Field(..., description="Citizen explicit voluntary consent to receive emergency alerts")
    push_subscription: Optional[PushSubscriptionPayload] = None

class AlertSubscriptionUpdate(BaseModel):
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    radius_km: Optional[float] = Field(default=None, ge=0.5, le=50.0)
    location_name: Optional[str] = Field(default=None, max_length=255)
    is_active: Optional[bool] = None
    push_subscription: Optional[PushSubscriptionPayload] = None

class AlertSubscriptionResponse(BaseModel):
    subscriber_token: str
    latitude: float
    longitude: float
    radius_km: float
    location_name: Optional[str] = None
    is_active: bool
    has_push: bool
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentApprovalRequest(BaseModel):
    custom_title: Optional[str] = Field(default=None, max_length=255, description="Custom advisory headline for the alert")
    title: Optional[str] = Field(default=None, max_length=255, description="Alternate alias for custom advisory headline")
    approx_location: Optional[str] = Field(default=None, max_length=255, description="Anonymized approximate public locality (e.g. Near Rajpur Road)")
    safety_instructions: Optional[str] = Field(default=None, max_length=2000, description="Public safety instructions and advisories")

class EmergencyAlertResponse(BaseModel):
    id: int
    incident_id: int
    tracking_id: Optional[str] = None
    category: str
    severity: int
    priority_level: str
    latitude: float
    longitude: float
    approx_location: Optional[str] = None
    title: str
    safety_instructions: Optional[str] = None
    dispatched_subscribers_count: int
    approved_by: str
    created_at: datetime
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

class SubscriberAlertItem(BaseModel):
    id: int
    alert_id: int
    incident_id: int
    tracking_id: str
    category: str
    severity: int
    priority_level: str
    title: str
    approx_location: Optional[str] = None
    safety_instructions: Optional[str] = None
    distance_km: float
    approved_by: str
    created_at: datetime
    is_read: bool

class AnalyticsResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    rejected_incidents: int
    critical_incidents: int
    high_incidents: int
    medium_incidents: int
    low_incidents: int
    incidents_by_type: List[dict]
    available_resources_count: int
    total_resources_count: int
    verified_incidents_count: Optional[int] = 0
    active_subscribers_count: Optional[int] = 0
