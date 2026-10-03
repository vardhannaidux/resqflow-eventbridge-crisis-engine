import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from classifier.app import classify_incident, RESOURCE_CATALOG

def test_deterministic_critical_severity_threshold():
    # 10 or more affected -> CRITICAL
    res = classify_incident("FIRE", 10, "High-density residential fire")
    assert res["severity"] == "CRITICAL"
    assert "FIRE_RESPONSE_TEAM_ALPHA" in res["recommendedResources"]
    assert "Immediate" in res["summary"] or "critical" in res["summary"]

def test_deterministic_high_severity_threshold():
    # 5 to 9 affected -> HIGH
    res = classify_incident("FIRE", 5, "Warehouse equipment fire")
    assert res["severity"] == "HIGH"
    assert "FIRE_RESPONSE_TEAM_BRAVO" in res["recommendedResources"]

def test_deterministic_medium_severity_threshold():
    # Under 5 affected -> MEDIUM
    res = classify_incident("FIRE", 3, "Small roadside debris fire")
    assert res["severity"] == "MEDIUM"
    assert "COMMUNITY_FIRE_PATROL" in res["recommendedResources"]

def test_flood_classification_recommendations():
    res = classify_incident("FLOOD", 12, "Inundated low-lying settlement")
    assert res["severity"] == "CRITICAL"
    assert "DISASTER_RESCUE_BOAT_CREW" in res["recommendedResources"]

def test_medical_classification_recommendations():
    res = classify_incident("MEDICAL", 8, "Multiple-casualty road incident")
    assert res["severity"] == "HIGH"
    assert "ADVANCED_LIFE_SUPPORT_UNIT" in res["recommendedResources"]

def test_unknown_type_uses_default_catalog():
    res = classify_incident("UNKNOWN_EVENT", 20, "Unspecified major event")
    assert res["severity"] == "CRITICAL"
    assert "SPECIAL_EMERGENCY_TASK_FORCE" in res["recommendedResources"]
