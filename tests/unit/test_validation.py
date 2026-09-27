import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from common.validation import validate_incident_payload

def test_valid_incident_payload():
    payload = {
        "type": "FIRE",
        "description": "Building fire with smoke visible",
        "peopleAffected": 12,
        "location": {
            "latitude": 17.3850,
            "longitude": 78.4867
        },
        "reportedBy": "TESTER-1"
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is True
    assert err is None
    assert cleaned["type"] == "FIRE"
    assert cleaned["peopleAffected"] == 12

def test_missing_description():
    payload = {
        "type": "FIRE",
        "description": "",
        "peopleAffected": 12,
        "location": {"latitude": 17.3850, "longitude": 78.4867}
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert "description" in err

def test_negative_people_affected():
    payload = {
        "type": "FLOOD",
        "description": "Flash flooding on highway",
        "peopleAffected": -5,
        "location": {"latitude": 17.3850, "longitude": 78.4867}
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert "peopleAffected" in err

def test_invalid_coordinates():
    payload = {
        "type": "MEDICAL",
        "description": "Emergency cardiac arrest",
        "peopleAffected": 1,
        "location": {"latitude": 150.0, "longitude": 78.4867}
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert "latitude" in err
