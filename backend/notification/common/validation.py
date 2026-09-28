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
