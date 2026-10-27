import os
import uuid
import json
import time
from collections import defaultdict
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from PIL import Image, UnidentifiedImageError

from .database import engine, Base, get_db, run_migrations
from .models import (
    User, Incident, Resource, Assignment, IncidentUpdate,
    AlertSubscription, EmergencyAlert, AlertDispatchLog
)
from .schemas import (
    LoginRequest, TokenResponse, UserResponse,
    IncidentCreate, IncidentResponse, IncidentStatusUpdate,
    IncidentAssignRequest, ResourceSchema, AnalyticsResponse,
    AlertSubscriptionCreate, AlertSubscriptionUpdate, AlertSubscriptionResponse,
    IncidentApprovalRequest, EmergencyAlertResponse, SubscriberAlertItem
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
from .alerts import (
    generate_subscriber_token,
    get_default_safety_instructions,
    dispatch_web_push_notification
)

run_migrations(engine)
Base.metadata.create_all(bind=engine)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Flood & Emergency Incident Response API",
    description="Backend API for emergency reporting, operator dashboard, and response dispatch",
    version="1.0.0"
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject defensive HTTP security headers into every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
    return response


# In-memory sliding-window rate limiter per client IP.
# Suitable for a small demo; production deployments should use
# a shared rate limiter such as Redis and a trusted proxy configuration.
_rate_limit_records = defaultdict(list)
_rate_limit_request_count = 0
MAX_RATE_LIMIT_BUCKETS = 10_000


def check_rate_limit(
    request: Request,
    limit: int = 20,
    window_seconds: int = 60,
    key_prefix: str = "",
):
    global _rate_limit_request_count

    client_ip = request.client.host if request.client else "unknown"
    bucket_key= f"{key_prefix}:{client_ip}"
    now = time.monotonic()
    cutoff = now - window_seconds

    # Periodically remove expired buckets, including inactive clients.
    _rate_limit_request_count += 1
    if _rate_limit_request_count >= 100:
        expired_keys = [
            key
            for key, timestamps in _rate_limit_records.items()
            if not timestamps or timestamps[-1] <= cutoff
        ]
        for key in expired_keys:
            del _rate_limit_records[key]
        _rate_limit_request_count = 0

    # Avoid unbounded growth from many distinct client addresses.
    if bucket_key not in _rate_limit_records:
        if len(_rate_limit_records) >= MAX_RATE_LIMIT_BUCKETS:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiter is temporarily busy. Please try again later.",
            )
        _rate_limit_records[bucket_key] = []

    timestamps = [
        timestamp
        for timestamp in _rate_limit_records[bucket_key]
        if timestamp > cutoff
    ]
    if len(timestamps) >= limit:
        _rate_limit_records[bucket_key] = timestamps
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again later.",
        )
    timestamps.append(now)
    _rate_limit_records[bucket_key] = timestamps


allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()

if not allowed_origins_env:
    if os.environ.get("ENV", "development").lower() == "production":
        raise RuntimeError(
            "ALLOWED_ORIGINS must be configured in production."
        )
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
else:
    origins = [
        origin.strip().rstrip("/")
        for origin in allowed_origins_env.split(",")
        if origin.strip()
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


@app.post("/api/auth/login", response_model=TokenResponse)
def login(creds: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Operator login with username & hashed password verification, returns JWT."""
    check_rate_limit(request, limit=5, window_seconds=60, key_prefix="login")
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


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

@app.post("/api/incidents/upload-photo")
async def upload_incident_photo(request: Request, file: UploadFile = File(...)):
    """Endpoint for citizens to optionally upload an incident photo with strict size & extension validation."""
    check_rate_limit(request, limit=10, window_seconds=60, key_prefix="upload")

    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG or WEBP images are allowed."
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image MIME type. Only JPG, PNG, or WEBP allowed."
        )

    unique_filename = f"{uuid.uuid4().hex[:10]}{ext}"
    destination = os.path.join(UPLOAD_DIR, unique_filename)

    total_size = 0
    try:
        with open(destination, "wb") as buffer:
            while chunk := await file.read(1024 * 64):
                total_size += len(chunk)
                if total_size > MAX_IMAGE_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(destination):
                        try:
                            os.remove(destination)
                        except OSError:
                            pass
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Photo must be under 5 MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(destination):
            try:
                os.remove(destination)
            except OSError:
                pass
        raise
    except Exception:
        if os.path.exists(destination):
            try:
                os.remove(destination)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail="Failed to save image file.")

    # Verify the actual image content, not just its extension or MIME type.
    expected_formats = {
        ".jpg": "JPEG",
        ".jpeg": "JPEG",
        ".png": "PNG",
        ".webp": "WEBP",
    }
    cleaned_destination = destination + ".clean"

    try:
        with Image.open(destination) as image:
            if image.format != expected_formats[ext]:
                raise ValueError("Image content does not match its file extension.")

            # Reject excessively large images to limit decompression-bomb risk.
            if image.width * image.height > 20_000_000:
                raise ValueError("Image dimensions are too large.")

            image.verify()

        # Reopen, fully decode, and re-encode the verified image.
        with Image.open(destination) as image:
            image.load()
            output_format = expected_formats[ext]

            if output_format == "JPEG":
                image = image.convert("RGB")
            elif output_format == "PNG":
                image = image.convert(
                    "RGBA" if "A" in image.getbands() else "RGB"
                )
            else:  # WEBP
                image = image.convert(
                    "RGBA" if "A" in image.getbands() else "RGB"
                )

            image.save(cleaned_destination, format=output_format)

        if os.path.getsize(cleaned_destination) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Processed photo exceeds the 5 MB limit."
            )

        os.replace(cleaned_destination, destination)

    except HTTPException:
        for path in (destination, cleaned_destination):
            if os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        for path in (destination, cleaned_destination):
            if os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unsupported image. Please upload a valid JPG, PNG, or WEBP."
        )

    return {"photo_url": f"/uploads/{unique_filename}"}

@app.post("/api/incidents")
def report_incident(data: IncidentCreate, request: Request, db: Session = Depends(get_db)):
    """
    Public reporting endpoint: Citizen submits incident without authentication.
    Computes priority score, assigns a tracking ID, and saves to database.
    Rate limited to prevent denial-of-service spam.
    """
    check_rate_limit(request, limit=15, window_seconds=60, key_prefix="report")

    score, level, breakdown = calculate_priority_score(
        severity=data.severity,
        people_affected=data.people_affected,
        vulnerable_involved=data.vulnerable_involved,
        incident_type=data.type
    )

    short_uuid = uuid.uuid4().hex[:4].upper()
    tracking_id = f"INC-{short_uuid}"

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
    by entering their Tracking ID (e.g. INC-8392).
    Disallows sequential numeric ID enumeration to protect citizen privacy.
    """
    cleaned = identifier.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Tracking ID is required")

    incident = db.query(Incident).filter(Incident.tracking_id.ilike(cleaned)).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found with the provided Tracking ID")

    updates = db.query(IncidentUpdate).filter(IncidentUpdate.incident_id == incident.id).order_by(IncidentUpdate.created_at.asc()).all()

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

@app.get("/api/incidents")
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    type_filter: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns incident list for the Operator dashboard (Protected).
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
            "is_verified": bool(inc.is_verified),
            "verified_at": inc.verified_at,
            "verified_by": inc.verified_by,
            "created_at": inc.created_at,
            "updated_at": inc.updated_at,
            "assigned_resources": teams
        })

    return result

@app.get("/api/incidents/{incident_id}")
def get_incident_detail(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full detail for the operator incident detail panel (Protected):
    - Score breakdown
    - Status history timeline
    - Assigned teams
    - 3 nearest available suitable response teams (with Haversine distances)
    - Proximity check to active road blockages (within 500m)
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    updates = db.query(IncidentUpdate).filter(
        IncidentUpdate.incident_id == incident.id
    ).order_by(IncidentUpdate.created_at.desc()).all()

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

    suitable_type = get_suitable_resource_type(incident.type)
    available_resources = db.query(Resource).filter(
        Resource.type == suitable_type,
        Resource.status == "Available"
    ).all()

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

    candidates.sort(key=lambda x: x["distance_km"])
    nearest_teams = candidates[:3]

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
        "is_verified": bool(incident.is_verified),
        "verified_at": incident.verified_at,
        "verified_by": incident.verified_by,
        "alert": {
            "id": incident.alert.id,
            "title": incident.alert.title,
            "category": incident.alert.category,
            "severity": incident.alert.severity,
            "approx_location": incident.alert.approx_location,
            "safety_instructions": incident.alert.safety_instructions,
            "dispatched_subscribers_count": incident.alert.dispatched_subscribers_count,
            "approved_by": incident.alert.approved_by,
            "created_at": incident.alert.created_at
        } if incident.alert else None,
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

    log_entry = IncidentUpdate(
        incident_id=incident.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.username,
        comment=payload.comment or f"Status transitioned from {old_status} to {new_status}"
    )
    db.add(log_entry)

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

    resource.status = "Assigned"

    assignment = Assignment(
        incident_id=incident.id,
        resource_id=resource.id,
        assigned_at=datetime.utcnow(),
        status="Active"
    )
    db.add(assignment)

    old_status = incident.status
    if incident.status == "Reported":
        incident.status = "Assigned"
        incident.updated_at = datetime.utcnow()

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

@app.delete("/api/incidents/{incident_id}/assign/{resource_id}")
def unassign_resource_from_incident(
    incident_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recall / Stand down an assigned resource:
    - Sets assignment status to 'Recalled'
    - Resets resource status to 'Available'
    - If no other active assignments remain and status was 'Assigned', reverts incident status to 'Reported'
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    assignment = db.query(Assignment).filter(
        Assignment.incident_id == incident.id,
        Assignment.resource_id == resource.id,
        Assignment.status == "Active"
    ).first()

    if not assignment:
        raise HTTPException(status_code=400, detail="No active assignment found for this resource on this incident")

    assignment.status = "Recalled"
    assignment.released_at = datetime.utcnow()
    resource.status = "Available"

    remaining = db.query(Assignment).filter(
        Assignment.incident_id == incident.id,
        Assignment.status == "Active"
    ).count()

    old_status = incident.status
    if remaining == 0 and incident.status == "Assigned":
        incident.status = "Reported"
        incident.updated_at = datetime.utcnow()

    update_log = IncidentUpdate(
        incident_id=incident.id,
        old_status=old_status,
        new_status=incident.status,
        changed_by=current_user.username,
        comment=f"Recalled {resource.name} ({resource.type}) from incident back to Available."
    )
    db.add(update_log)
    db.commit()

    return {
        "message": f"Successfully recalled {resource.name}",
        "resource_id": resource.id,
        "resource_status": "Available",
        "incident_status": incident.status
    }

@app.get("/api/resources", response_model=List[ResourceSchema])
def list_resources(
    type_filter: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all seeded response teams and their real-time status (Protected)."""
    query = db.query(Resource)
    if type_filter and type_filter != "All":
        query = query.filter(Resource.type == type_filter)
    return query.all()

@app.get("/api/weather")
def get_weather():
    """Returns real-time weather alerts and precipitation for Dehradun."""
    return get_weather_forecast()

@app.get("/api/road-blockages")
def get_road_blockages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    type_counts = (
        db.query(Incident.type, func.count(Incident.id))
        .group_by(Incident.type)
        .all()
    )

    incidents_by_type = [
        {"type": t, "count": c}
        for t, c in type_counts
    ]

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
    verified_count = db.query(Incident).filter(Incident.is_verified == True).count()
    active_subs_count = db.query(AlertSubscription).filter(AlertSubscription.is_active == True).count()

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
        "total_resources_count": total_res,
        "verified_incidents_count": verified_count,
        "active_subscribers_count": active_subs_count
    }


@app.post("/api/alerts/subscribe", response_model=AlertSubscriptionResponse)
def subscribe_to_alerts(
    payload: AlertSubscriptionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Voluntary citizen subscription for location-targeted verified emergency alerts.
    Requires explicit consent. Returns a cryptographically secure, unguessable token
    that allows managing/cancelling subscription without public exposure.
    """
    check_rate_limit(request, limit=15, window_seconds=60, key_prefix="alert_sub")

    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit citizen consent is required to subscribe to emergency alerts."
        )

    if not (-90.0 <= payload.latitude <= 90.0) or not (-180.0 <= payload.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates. Latitude must be in [-90, 90] and Longitude in [-180, 180]."
        )

    if not (0.5 <= payload.radius_km <= 50.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert radius must be between 0.5 km and 50.0 km."
        )

    token = generate_subscriber_token()

    push_endpoint = None
    push_p256dh = None
    push_auth = None

    if payload.push_subscription:
        push_endpoint = payload.push_subscription.endpoint
        push_p256dh = payload.push_subscription.keys.p256dh
        push_auth = payload.push_subscription.keys.auth

    subscription = AlertSubscription(
        subscriber_token=token,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
        location_name=payload.location_name.strip() if payload.location_name else None,
        is_active=True,
        push_endpoint=push_endpoint,
        push_p256dh=push_p256dh,
        push_auth=push_auth,
        consent_given_at=datetime.utcnow()
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return {
        "subscriber_token": subscription.subscriber_token,
        "latitude": subscription.latitude,
        "longitude": subscription.longitude,
        "radius_km": subscription.radius_km,
        "location_name": subscription.location_name,
        "is_active": subscription.is_active,
        "has_push": bool(subscription.push_endpoint),
        "created_at": subscription.created_at
    }


@app.get("/api/alerts/subscriptions/{token}", response_model=AlertSubscriptionResponse)
def get_subscription_details(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Retrieve private subscription preferences for the token bearer."""
    check_rate_limit(request, limit=30, window_seconds=60, key_prefix="alert_get_sub")

    cleaned_token = token.strip()
    if not cleaned_token:
        raise HTTPException(status_code=400, detail="Subscription token is required.")

    sub = db.query(AlertSubscription).filter(AlertSubscription.subscriber_token == cleaned_token).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Alert subscription not found.")

    return {
        "subscriber_token": sub.subscriber_token,
        "latitude": sub.latitude,
        "longitude": sub.longitude,
        "radius_km": sub.radius_km,
        "location_name": sub.location_name,
        "is_active": sub.is_active,
        "has_push": bool(sub.push_endpoint),
        "created_at": sub.created_at
    }


@app.patch("/api/alerts/subscriptions/{token}", response_model=AlertSubscriptionResponse)
def update_subscription_preferences(
    token: str,
    payload: AlertSubscriptionUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update citizen alert location, radius, or active toggle."""
    check_rate_limit(request, limit=20, window_seconds=60, key_prefix="alert_patch_sub")

    sub = db.query(AlertSubscription).filter(AlertSubscription.subscriber_token == token.strip()).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Alert subscription not found.")

    if payload.latitude is not None and payload.longitude is not None:
        if not (-90.0 <= payload.latitude <= 90.0) or not (-180.0 <= payload.longitude <= 180.0):
            raise HTTPException(status_code=400, detail="Invalid coordinates.")
        sub.latitude = payload.latitude
        sub.longitude = payload.longitude

    if payload.radius_km is not None:
        if not (0.5 <= payload.radius_km <= 50.0):
            raise HTTPException(status_code=400, detail="Radius must be between 0.5 km and 50 km.")
        sub.radius_km = payload.radius_km

    if payload.location_name is not None:
        sub.location_name = payload.location_name.strip() or None

    if payload.is_active is not None:
        sub.is_active = payload.is_active

    if payload.push_subscription:
        sub.push_endpoint = payload.push_subscription.endpoint
        sub.push_p256dh = payload.push_subscription.keys.p256dh
        sub.push_auth = payload.push_subscription.keys.auth

    sub.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sub)

    return {
        "subscriber_token": sub.subscriber_token,
        "latitude": sub.latitude,
        "longitude": sub.longitude,
        "radius_km": sub.radius_km,
        "location_name": sub.location_name,
        "is_active": sub.is_active,
        "has_push": bool(sub.push_endpoint),
        "created_at": sub.created_at
    }


@app.delete("/api/alerts/subscriptions/{token}")
def unsubscribe_from_alerts(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Unsubscribe and revoke emergency alert consent."""
    check_rate_limit(request, limit=20, window_seconds=60, key_prefix="alert_del_sub")

    sub = db.query(AlertSubscription).filter(AlertSubscription.subscriber_token == token.strip()).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Alert subscription not found.")

    sub.is_active = False
    sub.push_endpoint = None
    sub.push_p256dh = None
    sub.push_auth = None
    sub.updated_at = datetime.utcnow()
    db.commit()

    return {
        "message": "Successfully unsubscribed from emergency alerts.",
        "is_active": False
    }


@app.get("/api/alerts/subscriber/{token}", response_model=List[SubscriberAlertItem])
def get_subscriber_notifications(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Retrieve in-app notifications dispatched to this subscriber within their chosen radius.
    Sorted descending by alert time.
    """
    check_rate_limit(request, limit=30, window_seconds=60, key_prefix="alert_get_items")

    sub = db.query(AlertSubscription).filter(AlertSubscription.subscriber_token == token.strip()).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Alert subscription not found.")

    if not sub.is_active:
        return []

    dispatches = (
        db.query(AlertDispatchLog)
        .filter(AlertDispatchLog.subscription_id == sub.id)
        .order_by(AlertDispatchLog.created_at.desc())
        .limit(50)
        .all()
    )

    items = []
    for d in dispatches:
        alert = d.alert
        if not alert:
            continue
        inc = alert.incident
        items.append({
            "id": d.id,
            "alert_id": alert.id,
            "incident_id": alert.incident_id,
            "tracking_id": inc.tracking_id if inc else f"INC-{alert.incident_id}",
            "category": alert.category,
            "severity": alert.severity,
            "priority_level": alert.priority_level,
            "title": alert.title,
            "approx_location": alert.approx_location,
            "safety_instructions": alert.safety_instructions,
            "distance_km": round(d.distance_km, 2),
            "approved_by": alert.approved_by,
            "created_at": alert.created_at,
            "is_read": d.is_read
        })

    return items


@app.post("/api/alerts/subscriber/{token}/read/{dispatch_id}")
def mark_alert_read(
    token: str,
    dispatch_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Mark an in-app emergency alert as read by the subscriber."""
    check_rate_limit(request, limit=30, window_seconds=60, key_prefix="alert_read")

    sub = db.query(AlertSubscription).filter(AlertSubscription.subscriber_token == token.strip()).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    dispatch = db.query(AlertDispatchLog).filter(
        AlertDispatchLog.id == dispatch_id,
        AlertDispatchLog.subscription_id == sub.id
    ).first()

    if not dispatch:
        raise HTTPException(status_code=404, detail="Notification item not found.")

    dispatch.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "id": dispatch.id, "is_read": True}


@app.get("/api/alerts/active", response_model=List[EmergencyAlertResponse])
def get_public_active_alerts(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public broadcast feed of verified emergency alerts from the past 48 hours.
    Anonymized: strictly omits reporting citizen's personal information.
    """
    check_rate_limit(request, limit=60, window_seconds=60, key_prefix="alert_active")

    alerts = (
        db.query(EmergencyAlert)
        .order_by(EmergencyAlert.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for a in alerts:
        inc = a.incident
        result.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "tracking_id": inc.tracking_id if inc else f"INC-{a.incident_id}",
            "category": a.category,
            "severity": a.severity,
            "priority_level": a.priority_level,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "approx_location": a.approx_location,
            "title": a.title,
            "safety_instructions": a.safety_instructions,
            "dispatched_subscribers_count": a.dispatched_subscribers_count,
            "approved_by": a.approved_by,
            "created_at": a.created_at,
            "distance_km": None
        })

    return result


@app.post("/api/incidents/{incident_id}/approve")
def approve_and_broadcast_incident(
    incident_id: int,
    payload: IncidentApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Explicit Operator Approval & Emergency Broadcast Trigger (Protected).
    - Requires authenticated emergency operator or admin.
    - Validates incident exists and is not 'Rejected'.
    - Validates coordinates exist.
    - Idempotent: safe against concurrent or repeated approval requests.
    - DOES NOT implicitly alter operational status (status remains Reported/Assigned etc.).
    - Finds active subscribers within their chosen radius and logs persistent dispatches.
    - Dispatches Web Push if VAPID is configured, otherwise logs in-app delivery.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found.")

    if incident.status == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve or broadcast alerts for a rejected incident."
        )

    if incident.latitude is None or incident.longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident coordinates are missing. Geographic alert targeting cannot be computed."
        )

    if not (-90.0 <= incident.latitude <= 90.0) or not (-180.0 <= incident.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident coordinates are out of valid geographic range [-90 to 90, -180 to 180]."
        )

    existing_alert = db.query(EmergencyAlert).filter(EmergencyAlert.incident_id == incident.id).first()
    if existing_alert or incident.is_verified:
        return {
            "message": "Incident is already verified and emergency broadcast active.",
            "already_approved": True,
            "alert_id": existing_alert.id if existing_alert else None,
            "incident_id": incident.id,
            "is_verified": incident.is_verified,
            "verified_at": incident.verified_at,
            "verified_by": incident.verified_by,
            "subscribers_notified": existing_alert.dispatched_subscribers_count if existing_alert else 0
        }

    incident.is_verified = True
    incident.verified_at = datetime.utcnow()
    incident.verified_by = current_user.username
    incident.updated_at = datetime.utcnow()

    title = payload.custom_title or payload.title or f"Verified Emergency: {incident.type} in Dehradun"
    approx_loc = payload.approx_location or f"{incident.latitude:.3f}°N, {incident.longitude:.3f}°E sector"
    safety_info = payload.safety_instructions or get_default_safety_instructions(incident.type)

    alert = EmergencyAlert(
        incident_id=incident.id,
        approved_by=current_user.username,
        category=incident.type,
        severity=incident.severity,
        priority_level=incident.priority_level,
        latitude=incident.latitude,
        longitude=incident.longitude,
        approx_location=approx_loc,
        title=title,
        safety_instructions=safety_info,
        dispatched_subscribers_count=0
    )
    db.add(alert)
    db.flush()  # assign alert.id

    update_log = IncidentUpdate(
        incident_id=incident.id,
        old_status=incident.status,
        new_status=incident.status,  # Preserves workflow status!
        changed_by=current_user.username,
        comment=f"Operator verified incident. Broadcasted public emergency alert docket #{incident.tracking_id}."
    )
    db.add(update_log)

    active_subscribers = (
        db.query(AlertSubscription)
        .filter(AlertSubscription.is_active == True)
        .all()
    )

    notified_count = 0
    for sub in active_subscribers:
        dist = haversine_distance_km(
            incident.latitude, incident.longitude,
            sub.latitude, sub.longitude
        )

        if dist <= sub.radius_km:
            existing_dispatch = db.query(AlertDispatchLog).filter(
                AlertDispatchLog.alert_id == alert.id,
                AlertDispatchLog.subscription_id == sub.id
            ).first()

            if not existing_dispatch:
                channel = "in-app"
                if sub.push_endpoint and sub.push_p256dh and sub.push_auth:
                    push_success = dispatch_web_push_notification(
                        push_endpoint=sub.push_endpoint,
                        p256dh=sub.push_p256dh,
                        auth=sub.push_auth,
                        payload={
                            "title": title,
                            "body": f"{approx_loc}: {safety_info[:140]}...",
                            "tag": f"dects-alert-{alert.id}",
                            "data": {
                                "alert_id": alert.id,
                                "incident_id": incident.id,
                                "tracking_id": incident.tracking_id
                            }
                        }
                    )
                    if push_success:
                        channel = "web-push"

                dispatch_entry = AlertDispatchLog(
                    alert_id=alert.id,
                    subscription_id=sub.id,
                    distance_km=round(dist, 2),
                    delivery_channel=channel,
                    delivery_status="Delivered",
                    is_read=False
                )
                db.add(dispatch_entry)
                notified_count += 1

    alert.dispatched_subscribers_count = notified_count
    db.commit()
    db.refresh(incident)
    db.refresh(alert)

    return {
        "message": f"Incident verified. Emergency alert dispatched to {notified_count} eligible nearby subscribers.",
        "already_approved": False,
        "alert_id": alert.id,
        "incident_id": incident.id,
        "tracking_id": incident.tracking_id,
        "is_verified": incident.is_verified,
        "verified_at": incident.verified_at,
        "verified_by": incident.verified_by,
        "subscribers_notified": notified_count,
        "approx_location": alert.approx_location,
        "title": alert.title
    }
