import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from classifier.app import classify_incident

def test_critical_classification():
    result = classify_incident("FIRE", 15, "Major school fire")
    assert result["severity"] == "CRITICAL"
    assert "FIRE_RESPONSE_TEAM_ALPHA" in result["recommendedResources"]

def test_high_classification():
    result = classify_incident("FIRE", 7, "Warehouse fire")
    assert result["severity"] == "HIGH"
    assert "FIRE_RESPONSE_TEAM_BRAVO" in result["recommendedResources"]

def test_medium_classification():
    result = classify_incident("FIRE", 2, "Trash bin fire")
    assert result["severity"] == "MEDIUM"
    assert "COMMUNITY_FIRE_PATROL" in result["recommendedResources"]

def test_medical_critical_classification():
    result = classify_incident("MEDICAL", 10, "Mass casualty accident")
    assert result["severity"] == "CRITICAL"
    assert "MOBILE_ICU_AMBULANCE" in result["recommendedResources"]
