import os
import json
from sqlalchemy.orm import Session
from .models import User, Resource, Incident, IncidentUpdate, Assignment
from .auth import hash_password
from .scoring import calculate_priority_score

def seed_database(db: Session):
    """
    Seeds initial operator user, ~10 emergency response teams in Dehradun,
    and a few sample incidents (including a Road Blockage) if tables are empty.
    """
    # 1. Seed / Update Operator Account
    operator_user = db.query(User).filter(User.username == "operator").first()

    op_password = os.environ.get("OPERATOR_PASSWORD", "")
    if not op_password:
        raise RuntimeError(
            "OPERATOR_PASSWORD must be set before seeding the operator account."
        )

    if not operator_user:
        new_op = User(
            username="operator",
            hashed_password=hash_password(op_password),
            role="operator"
        )
        db.add(new_op)
        db.commit()
        print("[SEED] Created operator account (username: operator)")
    elif "OPERATOR_PASSWORD" in os.environ:
        operator_user.hashed_password = hash_password(op_password)
        db.commit()
        print("[SEED] Updated operator password from environment")

    # 2. Seed Emergency Response Teams around Dehradun, Uttarakhand
    # Coordinates centered around Dehradun valley (~30.3165 N, 78.0322 E)
    if db.query(Resource).count() == 0:
        teams_data = [
            {
                "name": "Dehradun Central Ambulance (Doon Hospital)",
                "type": "ambulance",
                "status": "Available",
                "latitude": 30.3235,
                "longitude": 78.0396,
                "contact_number": "+91-135-2659001",
            },
            {
                "name": "Rajpur Road Quick Response Ambulance",
                "type": "ambulance",
                "status": "Available",
                "latitude": 30.3551,
                "longitude": 78.0682,
                "contact_number": "+91-135-2659002",
            },
            {
                "name": "ISBT Emergency Mobile ICU",
                "type": "ambulance",
                "status": "Available",
                "latitude": 30.2872,
                "longitude": 78.0069,
                "contact_number": "+91-135-2659003",
            },
            {
                "name": "Dehradun Main Fire Station (Clock Tower)",
                "type": "fire unit",
                "status": "Available",
                "latitude": 30.3256,
                "longitude": 78.0437,
                "contact_number": "+91-135-2653331",
            },
            {
                "name": "Raipur Road Sub Fire Station",
                "type": "fire unit",
                "status": "Available",
                "latitude": 30.3115,
                "longitude": 78.0820,
                "contact_number": "+91-135-2653332",
            },
            {
                "name": "Premnagar Fire & Hazard Unit",
                "type": "fire unit",
                "status": "Available",
                "latitude": 30.3341,
                "longitude": 77.9620,
                "contact_number": "+91-135-2653333",
            },
            {
                "name": "SDRF Flood Rescue Unit 1 (Rispana Bridge)",
                "type": "rescue team",
                "status": "Available",
                "latitude": 30.2985,
                "longitude": 78.0512,
                "contact_number": "+91-135-2712101",
            },
            {
                "name": "Bindal River Disaster Rescue Squad",
                "type": "rescue team",
                "status": "Available",
                "latitude": 30.3312,
                "longitude": 78.0280,
                "contact_number": "+91-135-2712102",
            },
            {
                "name": "Ballupur Disaster Response Team",
                "type": "rescue team",
                "status": "Available",
                "latitude": 30.3420,
                "longitude": 78.0125,
                "contact_number": "+91-135-2712103",
            },
            {
                "name": "Sahastradhara Mountain & Water Rescue",
                "type": "rescue team",
                "status": "Available",
                "latitude": 30.3850,
                "longitude": 78.1290,
                "contact_number": "+91-135-2712104",
            },
        ]

        for team in teams_data:
            db.add(Resource(**team))
        db.commit()
        print(f"[SEED] Seeded {len(teams_data)} response teams across Dehradun.")

    # 3. Seed initial sample incidents if none exist
    if db.query(Incident).count() == 0:
        sample_incidents = [
            {
                "tracking_id": "INC-7491",
                "type": "Road Blockage",
                "description": "Debris and fallen trees blocking both lanes near Clock Tower roundabout after storm runoff.",
                "latitude": 30.3245,
                "longitude": 78.0410,
                "people_affected": 8,
                "vulnerable_involved": False,
                "severity": 3,
                "status": "Reported",
            },
            {
                "tracking_id": "INC-3812",
                "type": "Flooding/Waterlogging",
                "description": "Severe waterlogging near Rispana riverbank homes, water entering ground floor dwellings.",
                "latitude": 30.2990,
                "longitude": 78.0520,
                "people_affected": 25,
                "vulnerable_involved": True,
                "severity": 4,
                "status": "Reported",
            },
            {
                "tracking_id": "INC-9204",
                "type": "Medical Emergency",
                "description": "Elderly citizen stranded in waterlogged home requiring oxygen cylinder refill and urgent evacuation.",
                "latitude": 30.3200,
                "longitude": 78.0370,
                "people_affected": 2,
                "vulnerable_involved": True,
                "severity": 5,
                "status": "In Progress",
            },
            {
                "tracking_id": "INC-1150",
                "type": "Fire",
                "description": "Electrical transformer short-circuit fire near Saharanpur Road intersection.",
                "latitude": 30.3080,
                "longitude": 78.0210,
                "people_affected": 6,
                "vulnerable_involved": False,
                "severity": 4,
                "status": "Resolved",
            }
        ]

        for item in sample_incidents:
            score, level, breakdown = calculate_priority_score(
                item["severity"],
                item["people_affected"],
                item["vulnerable_involved"],
                item["type"]
            )
            inc = Incident(
                tracking_id=item["tracking_id"],
                type=item["type"],
                description=item["description"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                people_affected=item["people_affected"],
                vulnerable_involved=item["vulnerable_involved"],
                severity=item["severity"],
                priority_score=score,
                priority_level=level,
                score_breakdown=json.dumps(breakdown),
                status=item["status"],
            )
            db.add(inc)
            db.flush()

            # Add initial update entry
            upd = IncidentUpdate(
                incident_id=inc.id,
                old_status=None,
                new_status=item["status"],
                changed_by="System Seed",
                comment=f"Incident initially logged with status: {item['status']}"
            )
            db.add(upd)

        db.commit()
        print("[SEED] Seeded initial demo incidents.")
