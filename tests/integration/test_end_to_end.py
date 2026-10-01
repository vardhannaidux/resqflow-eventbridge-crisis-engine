import os
import time
import requests
import json

# Usage: Set RESQFLOW_API_URL environment variable to test live deployment
API_URL = os.environ.get("RESQFLOW_API_URL")

def test_live_end_to_end():
    if not API_URL:
        print("RESQFLOW_API_URL not set. Skipping live test.")
        return

    payload = {
        "type": "FIRE",
        "description": "Integration Test: Verified live commercial fire incident",
        "peopleAffected": 14,
        "location": {
            "latitude": 17.3850,
            "longitude": 78.4867
        },
        "reportedBy": "INTEGRATION-TEST-SUITE"
    }

    # 1. Report Incident
    post_res = requests.post(f"{API_URL}/incidents", json=payload)
    assert post_res.status_code == 201, f"Expected 201, got {post_res.status_code}: {post_res.text}"
    created_data = post_res.json()
    incident_id = created_data["incidentId"]
    print(f"Reported incident: {incident_id}")

    # 2. Wait for EventBridge -> Classifier -> Step Functions pipeline
    time.sleep(6)

    # 3. Query Incident by ID
    get_res = requests.get(f"{API_URL}/incidents/{incident_id}")
    assert get_res.status_code == 200, f"Expected 200, got {get_res.status_code}: {get_res.text}"
    incident = get_res.json()
    print(f"Retrieved incident state: {json.dumps(incident, indent=2)}")

    assert incident["severity"] == "CRITICAL"
    assert incident["status"] in ["CLASSIFIED", "DISPATCHED"]
    assert "assignedTeam" in incident

    # 4. Test GSI Query Filtering by status
    gsi_res = requests.get(f"{API_URL}/incidents?status={incident['status']}")
    assert gsi_res.status_code == 200
    gsi_data = gsi_res.json()
    assert "incidents" in gsi_data
    found_ids = [inc["incidentId"] for inc in gsi_data["incidents"]]
    assert incident_id in found_ids, f"Incident {incident_id} not found in GSI results"
    print(f"GSI Query verified: {len(gsi_data['incidents'])} incidents with status {incident['status']}")

    # 5. Test Incident Resolution Lifecycle
    resolve_res = requests.post(f"{API_URL}/incidents/{incident_id}/resolve", json={"notes": "Integration test verified resolved"})
    assert resolve_res.status_code == 200
    resolve_data = resolve_res.json()
    assert resolve_data["status"] == "RESOLVED"
    print(f"Incident {incident_id} successfully marked as RESOLVED")

    # 6. Test Multi-Incident Disaster Simulation Drill
    drill_res = requests.post(f"{API_URL}/incidents/drill")
    assert drill_res.status_code == 201
    drill_data = drill_res.json()
    assert len(drill_data.get("incidents", [])) == 3
    print(f"Drill verified: {len(drill_data['incidents'])} incidents dispatched in parallel")
