import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from common.validation import validate_incident_payload

def test_missing_all_fields():
    payload = {}
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert err is not None

def test_unsupported_type_rejection():
    payload = {
        "type": "METEOR_SHOWER",
        "description": "Alien invasion",
        "peopleAffected": 100,
        "location": {"latitude": 0, "longitude": 0}
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert "type" in err

def test_non_numeric_people_affected():
    payload = {
        "type": "FIRE",
        "description": "Fire alert",
        "peopleAffected": "fifty",
        "location": {"latitude": 0, "longitude": 0}
    }
    is_valid, err, cleaned = validate_incident_payload(payload)
    assert is_valid is False
    assert "peopleAffected" in err
