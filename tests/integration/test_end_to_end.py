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
    time.sleep(5)

    # 3. Query Incident by ID
    get_res = requests.get(f"{API_URL}/incidents/{incident_id}")
    assert get_res.status_code == 200, f"Expected 200, got {get_res.status_code}: {get_res.text}"
    incident = get_res.json()
    print(f"Retrieved incident state: {json.dumps(incident, indent=2)}")

    assert incident["severity"] == "CRITICAL"
    assert incident["status"] in ["CLASSIFIED", "DISPATCHED"]
    assert "assignedTeam" in incident

if __name__ == "__main__":
    test_live_end_to_end()
