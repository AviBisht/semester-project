"""
DECTS Automated Verification Suite for Phase 2:
Verified Nearby Emergency Alert Subscription System
"""
import sys
import os
import json

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Setup backend import path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_path, ".env"))

class ApiClient:
    def __init__(self):
        try:
            import requests
            r = requests.get("http://127.0.0.1:8000/api/analytics", timeout=0.8)
            if r.status_code == 200:
                self.is_live = True
                self.session = requests.Session()
                self.base_url = "http://127.0.0.1:8000"
                print("[INFO] Connected to live FastAPI server on port 8000")
                return
        except Exception:
            pass
        
        from starlette.testclient import TestClient
        # pyrefly: ignore[missing-import]
        from app.main import app
        self.is_live = False
        self.client = TestClient(app)
        print("[INFO] Testing with in-process FastAPI TestClient (self-contained)")

    def get(self, path, **kwargs):
        if self.is_live:
            return self.session.get(f"{self.base_url}{path}", **kwargs)
        return self.client.get(path, **kwargs)

    def post(self, path, **kwargs):
        if self.is_live:
            return self.session.post(f"{self.base_url}{path}", **kwargs)
        return self.client.post(path, **kwargs)

    def patch(self, path, **kwargs):
        if self.is_live:
            return self.session.patch(f"{self.base_url}{path}", **kwargs)
        return self.client.patch(path, **kwargs)

    def delete(self, path, **kwargs):
        if self.is_live:
            return self.session.delete(f"{self.base_url}{path}", **kwargs)
        return self.client.delete(path, **kwargs)

def log(msg, status="INFO"):
    prefixes = {
        "INFO": "[INFO]",
        "PASS": "[PASS]",
        "FAIL": "[FAIL]",
        "WARN": "[WARN]"
    }
    print(f"{prefixes.get(status, '[INFO]')} {msg}")

def run_tests():
    client = ApiClient()
    log("Beginning Automated Verification Suite for Emergency Alerts System...")

    # Load operator password from backend/.env if available
    op_password = os.environ.get("OPERATOR_PASSWORD", "")
    backend_env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
    if os.path.exists(backend_env_path):
        with open(backend_env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("OPERATOR_PASSWORD="):
                    op_password = line.strip().split("=", 1)[1]

    # 1. Login as operator to obtain JWT
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "operator", "password": op_password}
    )
    if login_resp.status_code != 200:
        log(f"Operator login failed: {login_resp.status_code} {login_resp.text}", "FAIL")
        sys.exit(1)
    
    op_token = login_resp.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}
    log("Operator authentication successful with valid JWT.", "PASS")

    # 2. Verify authorization enforcement on approval endpoint (Requirement 2)
    dummy_approve = client.post("/api/incidents/1/approve", json={"title": "Test"})
    if dummy_approve.status_code in [401, 403]:
        log("Requirement 2 verified: Approval endpoint rejects unauthenticated requests (401/403).", "PASS")
    else:
        log(f"Approval endpoint did not enforce auth: {dummy_approve.status_code}", "FAIL")
        sys.exit(1)

    # 3. Input validation: Subscription radius and coordinates bounds (Requirement 5)
    bad_sub_resp = client.post(
        "/api/alerts/subscribe",
        json={
            "latitude": 30.3165,
            "longitude": 78.0322,
            "radius_km": 150.0, # Exceeds max 50km
            "consent": True
        }
    )
    if bad_sub_resp.status_code == 422:
        log("Requirement 5 verified: Server rejected radius exceeding bounds (>50km with 422).", "PASS")
    else:
        log(f"Expected 422 for invalid radius, got {bad_sub_resp.status_code}", "FAIL")
        sys.exit(1)

    # 4. Create Subscriber 1 (Nearby: Clock Tower Dehradun, 30.3256, 78.0437, radius 5km) (Requirement 3 & 5)
    sub1_resp = client.post(
        "/api/alerts/subscribe",
        json={
            "latitude": 30.3256,
            "longitude": 78.0437,
            "radius_km": 5.0,
            "location_name": "Clock Tower, Dehradun",
            "consent": True
        }
    )
    if sub1_resp.status_code != 200:
        log(f"Subscriber 1 creation failed: {sub1_resp.text}", "FAIL")
        sys.exit(1)
    
    sub1_data = sub1_resp.json()
    token1 = sub1_data["subscriber_token"]
    assert len(token1) >= 40, "Token must be a cryptographically secure token"
    log(f"Requirement 3 verified: Subscriber 1 created with unguessable token (len={len(token1)}).", "PASS")

    # 5. Create Subscriber 2 (Far away: Haridwar Bypass, 29.9457, 78.1642, radius 5km)
    sub2_resp = client.post(
        "/api/alerts/subscribe",
        json={
            "latitude": 29.9457,
            "longitude": 78.1642,
            "radius_km": 5.0,
            "location_name": "Haridwar Bypass",
            "consent": True
        }
    )
    if sub2_resp.status_code != 200:
        log(f"Subscriber 2 creation failed: {sub2_resp.text}", "FAIL")
        sys.exit(1)
    
    token2 = sub2_resp.json()["subscriber_token"]
    log("Subscriber 2 (far away location ~45km from Dehradun) created successfully.", "PASS")

    # 6. Citizen files an incident (Landslide near Rajpur Road, Dehradun: 30.3350, 78.0550 - approx 1.5km from Clock Tower)
    incident_payload = {
        "type": "Road Blockage",
        "description": "Massive rockfall blocking both lanes. Traffic halted.",
        "latitude": 30.3350,
        "longitude": 78.0550,
        "people_affected": 8,
        "vulnerable_involved": False,
        "severity": 4
    }
    inc_resp = client.post("/api/incidents", json=incident_payload)
    if inc_resp.status_code != 200:
        log(f"Incident filing failed: {inc_resp.text}", "FAIL")
        sys.exit(1)
    
    incident = inc_resp.json()
    incident_id = incident["id"]
    tracking_id = incident["tracking_id"]
    log(f"Citizen filed incident #{incident_id} [{tracking_id}], status='{incident['status']}'.", "PASS")

    # 7. Verify NO alerts exist for pending/unverified incident (Requirement 9)
    sub1_alerts = client.get(f"/api/alerts/subscriber/{token1}").json()
    assert len(sub1_alerts) == 0, "No alerts must be dispatched for unverified/pending incidents!"
    log("Requirement 9 verified: Unverified incident triggered 0 alerts to subscribers.", "PASS")

    # 8. Operator approves the incident with custom title and safety instructions
    approve_payload = {
        "custom_title": "URGENT: Road Blockage Alert - Rajpur Road Corridor Closed",
        "title": "URGENT: Road Blockage Alert - Rajpur Road Corridor Closed",
        "approx_location": "Rajpur Road Corridor, Dehradun",
        "safety_instructions": "Avoid Rajpur Road. Use Mussoorie Bypass route. Do not approach unstable hillside slopes."
    }
    appr_resp = client.post(
        f"/api/incidents/{incident_id}/approve",
        headers=op_headers,
        json=approve_payload
    )
    if appr_resp.status_code != 200:
        log(f"Operator approval failed: {appr_resp.status_code} {appr_resp.text}", "FAIL")
        sys.exit(1)
    
    appr_data = appr_resp.json()
    log(f"Operator approval completed: already_approved={appr_data['already_approved']}, notified={appr_data['subscribers_notified']}.", "PASS")
    assert appr_data["subscribers_notified"] >= 1, f"Expected nearby subscriber dispatched, got {appr_data['subscribers_notified']}"

    # 9. Verify Requirement 1: Verification status is separate from operational workflow status
    inc_check = client.get(f"/api/incidents/{incident_id}", headers=op_headers).json()
    assert inc_check["is_verified"] == True, "Incident is_verified must be True"
    assert inc_check["status"] == "Reported", f"Operational status must remain 'Reported' (untouched), got '{inc_check['status']}'"
    assert inc_check["verified_by"] == "operator", f"verified_by must record operator username, got {inc_check.get('verified_by')}"
    log("Requirement 1 verified: is_verified is True while operational workflow status remains untouched ('Reported').", "PASS")

    # 10. Verify Subscriber 1 received the alert, and Subscriber 2 received NOTHING (Requirement 5 & 7)
    sub1_alerts = client.get(f"/api/alerts/subscriber/{token1}").json()
    assert len(sub1_alerts) >= 1, f"Expected Subscriber 1 to have alert, got {len(sub1_alerts)}"
    alert_item = sub1_alerts[0]
    assert alert_item["category"] == "Road Blockage"
    assert alert_item["distance_km"] < 5.0, "Alert distance must be within subscriber's 5km radius"
    assert "Rajpur Road" in alert_item["title"]
    assert "Avoid Rajpur Road" in alert_item["safety_instructions"]
    log(f"Requirement 5 & 7 verified: In-app alert delivered to nearby subscriber (distance: {alert_item['distance_km']} km).", "PASS")

    sub2_alerts = client.get(f"/api/alerts/subscriber/{token2}").json()
    assert len(sub2_alerts) == 0, f"Distant Subscriber 2 must receive 0 alerts, got {len(sub2_alerts)}"
    log("Requirement 5 verified: Subscriber outside radius received 0 alerts.", "PASS")

    # 11. Verify Requirement 6 & 2: Idempotent re-approval prevents duplicate alerts
    re_appr_resp = client.post(
        f"/api/incidents/{incident_id}/approve",
        headers=op_headers,
        json=approve_payload
    )
    assert re_appr_resp.status_code == 200
    re_data = re_appr_resp.json()
    assert re_data["already_approved"] == True, "Repeat approval must indicate already_approved=True"
    assert re_data["subscribers_notified"] == 0 or re_data["subscribers_notified"] == appr_data["subscribers_notified"], "Repeat approval safe"
    
    sub1_alerts_after = client.get(f"/api/alerts/subscriber/{token1}").json()
    assert len(sub1_alerts_after) == len(sub1_alerts), "Idempotency failed: duplicate alert records created!"
    log("Requirement 6 verified: Idempotent re-approval prevented duplicate alerts and dispatches.", "PASS")

    # 12. Verify invalid coordinates handling (Requirement 5)
    # pyrefly: ignore[missing-import]
    from app.database import SessionLocal
    # pyrefly: ignore[missing-import]
    from app.models import Incident
    db_session = SessionLocal()
    corrupt_inc = Incident(
        tracking_id="INC-OUT-OF-BOUNDS",
        type="Other",
        description="Corrupted record with out of bounds coordinates",
        latitude=999.0,  # Invalid latitude outside [-90, 90]
        longitude=78.0,
        severity=1,
        status="Reported"
    )
    db_session.add(corrupt_inc)
    db_session.commit()
    db_session.refresh(corrupt_inc)
    
    no_coord_appr = client.post(
        f"/api/incidents/{corrupt_inc.id}/approve",
        headers=op_headers,
        json={"title": "Should fail"}
    )
    assert no_coord_appr.status_code == 400, f"Expected 400 for out of bounds coords, got {no_coord_appr.status_code}"
    assert "out of valid geographic range" in no_coord_appr.json()["detail"]
    db_session.delete(corrupt_inc)
    db_session.commit()
    db_session.close()
    log("Requirement 5 verified: Approval safely blocked when coordinates are out of bounds (400).", "PASS")

    bad_coord_appr = client.post(
        "/api/incidents/999999/approve",
        headers=op_headers,
        json={"title": "Should fail"}
    )
    assert bad_coord_appr.status_code == 404, "Expected 404 for non-existent incident"
    log("Invalid incident id handled with 404 correctly.", "PASS")

    # 13. Verify rejected incidents cannot be approved (Requirement 2 & 9)
    rej_inc = client.post(
        "/api/incidents",
        json={
            "type": "Fire",
            "description": "Confirmed hoax by field unit",
            "latitude": 30.3256,
            "longitude": 78.0437,
            "people_affected": 0,
            "severity": 1
        }
    ).json()
    
    # Operator updates status to Rejected
    status_update = client.patch(
        f"/api/incidents/{rej_inc['id']}/status",
        headers=op_headers,
        json={"new_status": "Rejected", "comment": "Hoax report"}
    )
    assert status_update.status_code == 200, f"Status update failed: {status_update.text}"
    
    # Try to approve rejected incident
    rej_appr = client.post(
        f"/api/incidents/{rej_inc['id']}/approve",
        headers=op_headers,
        json={"title": "Should fail"}
    )
    assert rej_appr.status_code == 400, f"Expected 400 for approving rejected incident, got {rej_appr.status_code}"
    log(f"Requirement 2 & 9 verified: Server refused approval of rejected incident: {rej_appr.json()['detail']}", "PASS")

    # 14. Verify Subscriber Management: Update alert area & radius (Requirement 8)
    upd_resp = client.patch(
        f"/api/alerts/subscriptions/{token1}",
        json={"radius_km": 15.0, "location_name": "Greater Dehradun Region"}
    )
    assert upd_resp.status_code == 200, f"Update subscription failed: {upd_resp.text}"
    assert upd_resp.json()["radius_km"] == 15.0
    log("Requirement 8 verified: Subscriber successfully updated alert radius to 15km.", "PASS")

    # 15. Verify Mark Alert as Read (Requirement 7)
    dispatch_id = alert_item["id"]
    read_resp = client.post(f"/api/alerts/subscriber/{token1}/read/{dispatch_id}")
    assert read_resp.status_code == 200
    sub1_alerts_read = client.get(f"/api/alerts/subscriber/{token1}").json()
    marked_alert = [a for a in sub1_alerts_read if a["id"] == dispatch_id][0]
    assert marked_alert["is_read"] == True
    log("Requirement 7 verified: In-app alert marked as read successfully.", "PASS")

    # 16. Verify Privacy: Subscriber token and coordinates not in public broadcasts (Requirement 3 & 8)
    active_pub = client.get("/api/alerts/active").json()
    assert len(active_pub) >= 1
    for alert in active_pub:
        assert "subscriber_token" not in alert
        assert "token" not in alert
        assert "contact_phone" not in alert
    log("Requirement 3 & 8 verified: Public active alerts contain no subscriber tokens, identities, or contact info.", "PASS")

    # 17. Verify Unsubscribe / Revoke consent (Requirement 8)
    del_resp = client.delete(f"/api/alerts/subscriptions/{token1}")
    assert del_resp.status_code == 200
    sub1_get = client.get(f"/api/alerts/subscriptions/{token1}").json()
    assert sub1_get["is_active"] == False, "Subscription must be inactive after unsubscribe"
    log("Requirement 8 verified: Subscriber revoked consent and unsubscribed cleanly.", "PASS")

    # 18. Verify Regression: Analytics, Public Tracking, Incident listing all intact (Requirement 10)
    analytics_resp = client.get("/api/analytics", headers=op_headers)
    assert analytics_resp.status_code == 200
    an_data = analytics_resp.json()
    assert "total_incidents" in an_data
    assert "verified_incidents_count" in an_data
    log(f"Requirement 10 regression check passed: Analytics online (total: {an_data['total_incidents']}, verified: {an_data['verified_incidents_count']}).", "PASS")

    tracking_resp = client.get(f"/api/incidents/track/{tracking_id}")
    assert tracking_resp.status_code == 200
    tr_data = tracking_resp.json()
    assert tr_data["tracking_id"] == tracking_id
    log(f"Requirement 10 regression check passed: Tracking endpoint online (tracking code {tracking_id} verified).", "PASS")

    print("\n" + "="*70)
    print("ALL VERIFICATION SUITE TESTS PASSED COMPLETELY AND SATISFIED ALL CONSTRAINTS!")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_tests()
