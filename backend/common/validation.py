from typing import Tuple, Dict, Any, Optional

ALLOWED_TYPES = {"FIRE", "FLOOD", "MEDICAL", "ACCIDENT", "EARTHQUAKE", "OTHER"}

def validate_incident_payload(payload: Optional[Dict[str, Any]]) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates POST /incidents request payload.
    Required fields: type, description, peopleAffected, location (latitude, longitude)
    """
    if not payload or not isinstance(payload, dict):
        return False, "Payload must be a non-empty JSON object", None

    incident_type = payload.get("type")
    if not incident_type or not isinstance(incident_type, str):
        return False, "Field 'type' is required and must be a string", None
    
    incident_type_upper = incident_type.strip().upper()
    if incident_type_upper not in ALLOWED_TYPES:
        return False, f"Field 'type' must be one of: {', '.join(sorted(ALLOWED_TYPES))}", None

    description = payload.get("description")
    if not description or not isinstance(description, str) or len(description.strip()) == 0:
        return False, "Field 'description' is required and cannot be empty", None

    people_affected = payload.get("peopleAffected")
    if people_affected is None or not isinstance(people_affected, int) or people_affected < 0:
        return False, "Field 'peopleAffected' is required and must be a non-negative integer", None

    location = payload.get("location")
    if not location or not isinstance(location, dict):
        return False, "Field 'location' is required and must be an object with latitude and longitude", None

    lat = location.get("latitude")
    lon = location.get("longitude")

    if lat is None or not isinstance(lat, (int, float)) or not (-90.0 <= float(lat) <= 90.0):
        return False, "Field 'location.latitude' must be a valid float between -90 and 90", None

    if lon is None or not isinstance(lon, (int, float)) or not (-180.0 <= float(lon) <= 180.0):
        return False, "Field 'location.longitude' must be a valid float between -180 and 180", None

    reported_by = payload.get("reportedBy", "ANONYMOUS")
    if not isinstance(reported_by, str):
        reported_by = str(reported_by)

    cleaned = {
        "type": incident_type_upper,
        "description": description.strip(),
        "peopleAffected": int(people_affected),
        "location": {
            "latitude": float(lat),
            "longitude": float(lon)
        },
        "reportedBy": reported_by.strip()
    }

    return True, None, cleaned

def validate_incident_patch(payload: Optional[Dict[str, Any]], current_status: str = "REPORTED") -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates PATCH /incidents/{incidentId} request payload.
    Permits updating description, peopleAffected, assignedTeam, hospital, notes, and status.
    Enforces status transition rules and prevents editing a RESOLVED incident.
    """
    if not payload or not isinstance(payload, dict):
        return False, "Patch body must be a non-empty JSON object", None

    if current_status == "RESOLVED":
        return False, "Cannot modify an incident that has already been RESOLVED", None

    ALLOWED_PATCH_FIELDS = {"description", "peopleAffected", "assignedTeam", "hospital", "status", "notes", "resolutionNotes"}
    
    cleaned: Dict[str, Any] = {}
    
    for key, val in payload.items():
        if key not in ALLOWED_PATCH_FIELDS:
            return False, f"Field '{key}' cannot be updated via PATCH. Allowed fields: {', '.join(sorted(ALLOWED_PATCH_FIELDS))}", None

        if key == "description":
            if not isinstance(val, str) or len(val.strip()) == 0:
                return False, "Field 'description' must be a non-empty string", None
            cleaned["description"] = val.strip()

        elif key == "peopleAffected":
            if not isinstance(val, int) or val < 0:
                return False, "Field 'peopleAffected' must be a non-negative integer", None
            cleaned["peopleAffected"] = val

        elif key == "assignedTeam":
            if not isinstance(val, str):
                return False, "Field 'assignedTeam' must be a string", None
            cleaned["assignedTeam"] = val.strip()

        elif key == "hospital":
            if not isinstance(val, str):
                return False, "Field 'hospital' must be a string", None
            cleaned["hospital"] = val.strip()

        elif key == "status":
            from common.models import validate_status_transition
            is_valid_transition, err = validate_status_transition(current_status, str(val))
            if not is_valid_transition:
                return False, err, None
            cleaned["status"] = str(val).strip().upper()

        elif key in ("notes", "resolutionNotes"):
            if not isinstance(val, str):
                return False, f"Field '{key}' must be a string", None
            cleaned[key] = val.strip()

    if not cleaned:
        return False, "Patch body must contain at least one valid field to update", None

    return True, None, cleaned

