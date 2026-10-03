import pytest
import sys
import os
import json
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from common.validation import validate_incident_patch
from common.models import STANDARD_RESPONSE_UNITS, STANDARD_HOSPITALS
import ingestion.app as ingestion_app

def test_validate_incident_patch_valid_fields():
    patch_body = {
        "description": "Updated situation report: fire contained on 2nd floor",
        "peopleAffected": 5,
        "assignedTeam": "ERT-Hyderabad-Alpha",
        "hospital": "Apollo Emergency & Trauma Care"
    }
    is_valid, err, cleaned = validate_incident_patch(patch_body, "REPORTED")
    assert is_valid is True
    assert err is None
    assert cleaned["peopleAffected"] == 5
    assert "fire contained" in cleaned["description"]

def test_validate_incident_patch_rejects_unpermitted_fields():
    patch_body = {
        "incidentId": "INC-TAMPERED",
        "createdAt": "2020-01-01T00:00:00Z"
    }
    is_valid, err, cleaned = validate_incident_patch(patch_body, "REPORTED")
    assert is_valid is False
    assert "cannot be updated via PATCH" in err

def test_validate_incident_patch_rejects_resolved_modification():
    patch_body = {
        "description": "Re-opening resolved emergency"
    }
    is_valid, err, cleaned = validate_incident_patch(patch_body, "RESOLVED")
    assert is_valid is False
    assert "Cannot modify an incident that has already been RESOLVED" in err

def test_handle_get_resources_catalog():
    res = ingestion_app.handle_get_resources()
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert "resources" in body
    assert "hospitals" in body
    assert len(body["resources"]) == len(STANDARD_RESPONSE_UNITS)
    assert len(body["hospitals"]) == len(STANDARD_HOSPITALS)

def test_handle_get_single_resource_found():
    res = ingestion_app.handle_get_resources("ERT-HYD-01")
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["id"] == "ERT-HYD-01"
    assert "Tier-1" in body["tier"]

def test_handle_get_single_resource_not_found():
    res = ingestion_app.handle_get_resources("NON-EXISTENT-UNIT")
    assert res["statusCode"] == 404

def test_handle_patch_incident_not_found():
    with patch.object(ingestion_app.table, "get_item", return_value={}):
        res = ingestion_app.handle_patch_incident("INC-MISSING", {"description": "New description"})
        assert res["statusCode"] == 404
        body = json.loads(res["body"])
        assert body["code"] == "NOT_FOUND"

def test_handle_resolve_incident_idempotent():
    existing_item = {
        "incidentId": "INC-TEST-01",
        "status": "RESOLVED",
        "resolvedAt": "2026-10-01T10:00:00Z"
    }
    with patch.object(ingestion_app.table, "update_item", side_effect=ingestion_app.ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException"}}, "UpdateItem"
    )):
        with patch.object(ingestion_app.table, "get_item", return_value={"Item": existing_item}):
            res = ingestion_app.handle_resolve_incident("INC-TEST-01", {"notes": "Already resolved"})
            assert res["statusCode"] == 200
            body = json.loads(res["body"])
            assert body["status"] == "RESOLVED"
            assert "idempotent" in body["message"]
