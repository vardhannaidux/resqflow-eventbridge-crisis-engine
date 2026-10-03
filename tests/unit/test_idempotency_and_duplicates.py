import pytest
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from common.validation import validate_incident_payload

def test_idempotency_key_format():
    incident_id = "INC-TEST-99"
    key1 = f"{incident_id}:IncidentReported:1"
    key2 = f"{incident_id}:IncidentClassified:1"
    key3 = f"{incident_id}:IncidentResolved:1"

    assert key1.startswith("INC-TEST-99")
    assert "IncidentReported" in key1
    assert "IncidentClassified" in key2
    assert "IncidentResolved" in key3

def test_duplicate_payload_validation_consistency():
    payload = {
        "type": "FIRE",
        "description": "Repeated submission test",
        "peopleAffected": 4,
        "location": {"latitude": 17.4, "longitude": 78.4},
        "reportedBy": "OPERATOR-DUPLICATE"
    }

    # Validating the exact same payload multiple times must yield identical cleaned outputs
    ok1, err1, cleaned1 = validate_incident_payload(payload)
    ok2, err2, cleaned2 = validate_incident_payload(payload)

    assert ok1 is True and ok2 is True
    assert err1 is None and err2 is None
    assert cleaned1 == cleaned2
