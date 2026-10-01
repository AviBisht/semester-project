import os
import uuid
import json
import shutil
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from .database import engine, Base, get_db
from .models import User, Incident, Resource, Assignment, IncidentUpdate
from .schemas import (
    LoginRequest, TokenResponse, UserResponse,
    IncidentCreate, IncidentResponse, IncidentStatusUpdate,
    IncidentAssignRequest, ResourceSchema, AnalyticsResponse
)
from .auth import verify_password, create_access_token, get_current_user
from .scoring import calculate_priority_score
from .utils import (
    haversine_distance_km,
    get_suitable_resource_type,
    check_blockage_proximity
)
from .weather import get_weather_forecast
from .seed import seed_database

# Create SQLite tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Flood & Emergency Incident Response API",
    description="Backend API for emergency reporting, operator dashboard, and response dispatch",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for uploaded incident photos
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Run DB seeding on startup
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()

# ----------------------------------------------------
# 1. AUTHENTICATION (Operators Only)
# ----------------------------------------------------

@app.post("/api/auth/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Operator login with username & hashed password verification, returns JWT."""
    user = db.query(User).filter(User.username == creds.username).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in operator."""
    return current_user

# ----------------------------------------------------
# 2. CITIZEN PUBLIC ENDPOINTS (No Login Required)
# ----------------------------------------------------

@app.post("/api/incidents/upload-photo")
async def upload_incident_photo(file: UploadFile = File(...)):
    """Endpoint for citizens to optionally upload an incident photo."""
    # Sanitize and create unique filename
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex[:10]}{ext}"
    destination = os.path.join(UPLOAD_DIR, unique_filename)

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"photo_url": f"/uploads/{unique_filename}"}

@app.post("/api/incidents")
def report_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    """
    Public reporting endpoint: Citizen submits incident without authentication.
    Computes priority score, assigns a tracking ID, and saves to database.
    """
    # 1. Compute priority score and breakdown using exact project formula
    score, level, breakdown = calculate_priority_score(
        severity=data.severity,
        people_affected=data.people_affected,
        vulnerable_involved=data.vulnerable_involved,
        incident_type=data.type
    )

    # 2. Generate a citizen-friendly tracking ID like INC-8392
    short_uuid = uuid.uuid4().hex[:4].upper()
    tracking_id = f"INC-{short_uuid}"

    # 3. Create incident record
    incident = Incident(
        tracking_id=tracking_id,
        type=data.type,
        description=data.description.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        people_affected=data.people_affected,
        vulnerable_involved=data.vulnerable_involved,
        severity=data.severity,
        photo_url=data.photo_url,
        priority_score=score,
        priority_level=level,
        score_breakdown=json.dumps(breakdown),
        status="Reported"
    )
    db.add(incident)
    db.flush()

    # 4. Log initial lifecycle update in incident_updates
    initial_log = IncidentUpdate(
        incident_id=incident.id,
        old_status=None,
        new_status="Reported",
        changed_by="Citizen (Public)",
        comment="Incident reported and registered in queue."
    )
    db.add(initial_log)
    db.commit()
    db.refresh(incident)

    return {
        "message": "Incident reported successfully",
        "id": incident.id,
        "tracking_id": incident.tracking_id,
        "priority_score": incident.priority_score,
        "priority_level": incident.priority_level,
        "status": incident.status,
    }

@app.get("/api/incidents/track/{identifier}")
def track_incident(identifier: str, db: Session = Depends(get_db)):
    """
    Public tracking endpoint: Citizens can look up status and timeline
    by entering their Tracking ID (e.g. INC-8392) or numeric ID.
    """
    incident = None
    if identifier.startswith("INC-") or identifier.startswith("inc-"):
        incident = db.query(Incident).filter(Incident.tracking_id.ilike(identifier)).first()
    elif identifier.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(identifier)).first()
    else:
        incident = db.query(Incident).filter(Incident.tracking_id.ilike(identifier)).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found with the provided Tracking ID")

    # Fetch updates ordered by timestamp
    updates = db.query(IncidentUpdate).filter(IncidentUpdate.incident_id == incident.id).order_by(IncidentUpdate.created_at.asc()).all()

    # Fetch active assignment if any
    active_assignment = db.query(Assignment).filter(
        Assignment.incident_id == incident.id,
        Assignment.status == "Active"
    ).first()

    assigned_team = None
    if active_assignment and active_assignment.resource:
        assigned_team = {
            "name": active_assignment.resource.name,
            "type": active_assignment.resource.type,
            "contact": active_assignment.resource.contact_number
        }

    return {
        "id": incident.id,
        "tracking_id": incident.tracking_id,
        "type": incident.type,
        "description": incident.description,
        "status": incident.status,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "people_affected": incident.people_affected,
        "vulnerable_involved": incident.vulnerable_involved,
        "severity": incident.severity,
        "photo_url": incident.photo_url,
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
        "assigned_team": assigned_team,
        "updates": [
            {
                "id": u.id,
                "old_status": u.old_status,
                "new_status": u.new_status,
                "changed_by": u.changed_by,
                "comment": u.comment,
                "created_at": u.created_at
            }
            for u in updates
        ]
    }

# ----------------------------------------------------
# 3. OPERATOR DASHBOARD & INCIDENT MANAGEMENT
# ----------------------------------------------------

@app.get("/api/incidents")
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    type_filter: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db)
):
    """
    Returns incident list for the Operator dashboard.
    Supports filtering by status, priority level, and incident type.
    """
    query = db.query(Incident)

    if status_filter and status_filter != "All":
        query = query.filter(Incident.status == status_filter)
    if priority_filter and priority_filter != "All":
        query = query.filter(Incident.priority_level == priority_filter)
    if type_filter and type_filter != "All":
        query = query.filter(Incident.type == type_filter)

    incidents = query.order_by(Incident.created_at.desc()).all()

    # Pre-fetch active assignments
    result = []
    for inc in incidents:
        active_assignments = db.query(Assignment).filter(
            Assignment.incident_id == inc.id,
            Assignment.status == "Active"
        ).all()
        teams = [{"id": a.resource.id, "name": a.resource.name, "type": a.resource.type} for a in active_assignments if a.resource]

        result.append({
            "id": inc.id,
            "tracking_id": inc.tracking_id,
            "type": inc.type,
            "description": inc.description,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "people_affected": inc.people_affected,
            "vulnerable_involved": inc.vulnerable_involved,
            "severity": inc.severity,
            "photo_url": inc.photo_url,
            "priority_score": inc.priority_score,
            "priority_level": inc.priority_level,
            "status": inc.status,
            "created_at": inc.created_at,
            "updated_at": inc.updated_at,
            "assigned_resources": teams
        })

    return result

@app.get("/api/incidents/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    """
    Full detail for the operator incident detail panel:
    - Score breakdown
    - Status history timeline
    - Assigned teams
    - 3 nearest available suitable response teams (with Haversine distances)
    - Proximity check to active road blockages (within 500m)
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # 1. Timeline updates
    updates = db.query(IncidentUpdate).filter(
        IncidentUpdate.incident_id == incident.id
    ).order_by(IncidentUpdate.created_at.desc()).all()

    # 2. Active assignments
    active_assignments = db.query(Assignment).filter(
        Assignment.incident_id == incident.id,
        Assignment.status == "Active"
    ).all()
    assigned_resources = [
        {
            "id": a.resource.id,
            "name": a.resource.name,
            "type": a.resource.type,
            "contact_number": a.resource.contact_number,
            "status": a.resource.status
        }
        for a in active_assignments if a.resource
    ]

    # 3. 3 Nearest AVAILABLE teams of suitable type
    suitable_type = get_suitable_resource_type(incident.type)
    available_resources = db.query(Resource).filter(
        Resource.type == suitable_type,
        Resource.status == "Available"
    ).all()

    # Calculate Haversine distance for each available candidate
    candidates = []
    for res in available_resources:
        dist = haversine_distance_km(incident.latitude, incident.longitude, res.latitude, res.longitude)
        candidates.append({
            "id": res.id,
            "name": res.name,
            "type": res.type,
            "status": res.status,
            "latitude": res.latitude,
            "longitude": res.longitude,
            "contact_number": res.contact_number,
            "distance_km": dist
        })

    # Sort ascending by distance and take top 3
    candidates.sort(key=lambda x: x["distance_km"])
    nearest_teams = candidates[:3]

    # 4. Check for active road blockages within 500m
    active_blockages = db.query(Incident).filter(
        Incident.type == "Road Blockage",
        Incident.status.notin_(["Resolved", "Rejected"]),
        Incident.id != incident.id
    ).all()

    nearby_blockages = check_blockage_proximity(
        incident.latitude,
        incident.longitude,
        active_blockages,
        threshold_meters=500.0
    )

    # Parse breakdown JSON
    breakdown_data = {}
    if incident.score_breakdown:
        try:
            breakdown_data = json.loads(incident.score_breakdown)
        except Exception:
            breakdown_data = {}

    return {
        "id": incident.id,
        "tracking_id": incident.tracking_id,
        "type": incident.type,
        "description": incident.description,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "people_affected": incident.people_affected,
        "vulnerable_involved": incident.vulnerable_involved,
        "severity": incident.severity,
        "photo_url": incident.photo_url,
        "priority_score": incident.priority_score,
        "priority_level": incident.priority_level,
        "score_breakdown": breakdown_data,
        "status": incident.status,
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
        "updates": [
            {
                "id": u.id,
                "old_status": u.old_status,
                "new_status": u.new_status,
                "changed_by": u.changed_by,
                "comment": u.comment,
                "created_at": u.created_at
            }
            for u in updates
        ],
        "assigned_resources": assigned_resources,
        "suitable_type": suitable_type,
        "nearest_available_teams": nearest_teams,
        "nearby_blockages": nearby_blockages
    }

@app.patch("/api/incidents/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Operator changes incident status (Reported -> Assigned -> In Progress -> Resolved / Rejected).
    Records history in incident_updates.
    If status is set to Resolved or Rejected, automatically frees all assigned teams back to Available.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = incident.status
    new_status = payload.new_status

    if old_status == new_status:
        return {"message": "Status unchanged", "status": new_status}

    incident.status = new_status
    incident.updated_at = datetime.utcnow()

    # Log in incident_updates
    log_entry = IncidentUpdate(
        incident_id=incident.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.username,
        comment=payload.comment or f"Status transitioned from {old_status} to {new_status}"
    )
    db.add(log_entry)

    # If resolved or rejected, free any assigned resources
    if new_status in ["Resolved", "Rejected"]:
        active_assignments = db.query(Assignment).filter(
            Assignment.incident_id == incident.id,
            Assignment.status == "Active"
        ).all()
        for assignment in active_assignments:
            assignment.status = "Completed"
            assignment.released_at = datetime.utcnow()
            if assignment.resource:
                assignment.resource.status = "Available"

    db.commit()
    db.refresh(incident)

    return {
        "message": f"Incident status successfully updated to {new_status}",
        "incident_id": incident.id,
        "old_status": old_status,
        "new_status": new_status
    }

@app.post("/api/incidents/{incident_id}/assign")
def assign_resource_to_incident(
    incident_id: int,
    payload: IncidentAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign an available emergency team to an incident:
    - Sets team status to 'Assigned'
    - Sets incident status to 'Assigned'
    - Creates assignment record
    - Adds timeline entry in incident_updates
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    resource = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.status != "Available":
        raise HTTPException(status_code=400, detail=f"Resource {resource.name} is currently {resource.status}")

    # Set resource status to Assigned
    resource.status = "Assigned"

    # Create assignment record
    assignment = Assignment(
        incident_id=incident.id,
        resource_id=resource.id,
        assigned_at=datetime.utcnow(),
        status="Active"
    )
    db.add(assignment)

    # Set incident status to Assigned if currently Reported
    old_status = incident.status
    if incident.status == "Reported":
        incident.status = "Assigned"
        incident.updated_at = datetime.utcnow()

    # Log in incident_updates
    update_log = IncidentUpdate(
        incident_id=incident.id,
        old_status=old_status,
        new_status=incident.status,
        changed_by=current_user.username,
        comment=payload.comment or f"Assigned {resource.name} ({resource.type}) to incident."
    )
    db.add(update_log)

    db.commit()

    return {
        "message": f"Assigned {resource.name} to Incident #{incident.id}",
        "incident_status": incident.status,
        "resource_name": resource.name,
        "resource_status": resource.status
    }

# ----------------------------------------------------
# 4. RESOURCES & TEAMS
# ----------------------------------------------------

@app.get("/api/resources", response_model=List[ResourceSchema])
def list_resources(type_filter: Optional[str] = Query(None, alias="type"), db: Session = Depends(get_db)):
    """List all seeded response teams and their real-time status."""
    query = db.query(Resource)
    if type_filter and type_filter != "All":
        query = query.filter(Resource.type == type_filter)
    return query.all()

# ----------------------------------------------------
# 5. WEATHER & ROAD BLOCKAGES
# ----------------------------------------------------

@app.get("/api/weather")
def get_weather():
    """Returns real-time weather alerts and precipitation for Dehradun."""
    return get_weather_forecast()

@app.get("/api/road-blockages")
def get_road_blockages(db: Session = Depends(get_db)):
    """
    Returns active Road Blockage incidents to render as translucent red circles
    (~300m radius) on the dashboard map.
    """
    blockages = db.query(Incident).filter(
        Incident.type == "Road Blockage",
        Incident.status.notin_(["Resolved", "Rejected"])
    ).all()

    return [
        {
            "id": b.id,
            "tracking_id": b.tracking_id,
            "description": b.description,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "radius_meters": 300,
            "status": b.status,
            "severity": b.severity,
            "created_at": b.created_at
        }
        for b in blockages
    ]

# ----------------------------------------------------
# 6. ANALYTICS (Single Bar Chart + Counts)
# ----------------------------------------------------

@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    """
    Single analytics page dataset:
    - Counts of incidents by type for single bar chart
    - Simple count of resolved vs active
    - Breakdown by priority tiers
    """
    total = db.query(Incident).count()
    active = db.query(Incident).filter(Incident.status.in_(["Reported", "Assigned", "In Progress"])).count()
    resolved = db.query(Incident).filter(Incident.status == "Resolved").count()
    rejected = db.query(Incident).filter(Incident.status == "Rejected").count()

    critical = db.query(Incident).filter(Incident.priority_level == "Critical").count()
    high = db.query(Incident).filter(Incident.priority_level == "High").count()
    medium = db.query(Incident).filter(Incident.priority_level == "Medium").count()
    low = db.query(Incident).filter(Incident.priority_level == "Low").count()

    # Incidents grouped by type
    type_counts = (
        db.query(Incident.type, func.count(Incident.id))
        .group_by(Incident.type)
        .all()
    )

    incidents_by_type = [
        {"type": t, "count": c}
        for t, c in type_counts
    ]

    # Ensure all canonical incident types are present in list for clean chart
    all_types = [
        "Flooding/Waterlogging",
        "Fire",
        "Road Accident",
        "Medical Emergency",
        "Road Blockage",
        "Other"
    ]
    existing_type_names = {item["type"] for item in incidents_by_type}
    for t in all_types:
        if t not in existing_type_names:
            incidents_by_type.append({"type": t, "count": 0})

    avail_res = db.query(Resource).filter(Resource.status == "Available").count()
    total_res = db.query(Resource).count()

    return {
        "total_incidents": total,
        "active_incidents": active,
        "resolved_incidents": resolved,
        "rejected_incidents": rejected,
        "critical_incidents": critical,
        "high_incidents": high,
        "medium_incidents": medium,
        "low_incidents": low,
        "incidents_by_type": incidents_by_type,
        "available_resources_count": avail_res,
        "total_resources_count": total_res
    }
