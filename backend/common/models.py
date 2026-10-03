import math
from typing import Dict, Any, List, Optional, Tuple

# Valid State Lifecycle Transitions for ResQFlow Incidents:
# REPORTED -> CLASSIFIED -> DISPATCHED -> RESOLVED
# Terminal state: RESOLVED cannot transition to any other status.
VALID_STATUSES = {"REPORTED", "CLASSIFIED", "DISPATCHED", "RESOLVED"}

VALID_TRANSITIONS = {
    "REPORTED": {"CLASSIFIED", "RESOLVED"},
    "CLASSIFIED": {"DISPATCHED", "RESOLVED"},
    "DISPATCHED": {"RESOLVED"},
    "RESOLVED": set() # Terminal state: cannot transition out
}

def validate_status_transition(current_status: str, new_status: str) -> Tuple[bool, Optional[str]]:
    """
    Validates if an incident status transition is permissible.
    Prevents invalid transitions, reopening resolved emergencies, or jumping states.
    """
    curr = (current_status or "REPORTED").upper()
    target = (new_status or "").upper()

    if target not in VALID_STATUSES:
        return False, f"Invalid status '{new_status}'. Allowed statuses: {', '.join(sorted(VALID_STATUSES))}"

    if curr == target:
        return True, None # Idempotent no-op

    if curr == "RESOLVED":
        return False, "Cannot modify or re-open an incident that has already been RESOLVED"

    allowed = VALID_TRANSITIONS.get(curr, set())
    if target not in allowed:
        return False, f"Invalid state transition from '{curr}' to '{target}'. Allowed next states: {', '.join(sorted(allowed)) if allowed else 'None'}"

    return True, None

def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates approximate straight-line great-circle distance between two geographic coordinates.
    CRITICAL SAFETY NOTICE: This is an approximate straight-line Euclidean/Haversine distance,
    NOT road distance, traffic-aware navigation, or verified travel time prediction.
    """
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# Resource Registry (Authoritative seed fixtures for Hyderabad Sector)
STANDARD_RESPONSE_UNITS: List[Dict[str, Any]] = [
    {
        "id": "ERT-HYD-01",
        "name": "ERT-Hyderabad-Alpha",
        "type": "Special Rapid Deployment",
        "tier": "Tier-1 Emergency Response",
        "vehicle": "Heavy Tactical Rescue & Trauma Rig",
        "crewSize": 6,
        "baseLocation": "Central Fire & Rescue HQ, Hyderabad",
        "latitude": 17.4065,
        "longitude": 78.4772,
        "status": "STANDBY",
        "specialties": ["High-Rise Extrication", "Critical Triage", "HazMat Containment"],
        "isSimulation": True
    },
    {
        "id": "PRT-HYD-02",
        "name": "PRT-Hyderabad-Bravo",
        "type": "Priority Tactical Unit",
        "tier": "Tier-2 Priority Response",
        "vehicle": "Advanced Life Support (ALS) Ambulance Unit",
        "crewSize": 4,
        "baseLocation": "West Sector Dispatch Depot, Banjara Hills",
        "latitude": 17.4156,
        "longitude": 78.4350,
        "status": "STANDBY",
        "specialties": ["Mass Casualty Triage", "Cardiac Resuscitation", "Traffic Extrication"],
        "isSimulation": True
    },
    {
        "id": "SRT-HYD-03",
        "name": "SRT-Hyderabad-Charlie",
        "type": "Standard First Responder",
        "tier": "Tier-3 Standard Response",
        "vehicle": "Rapid Patrol & First Aid Cruiser",
        "crewSize": 3,
        "baseLocation": "Cyberabad Police Commissionerate Base",
        "latitude": 17.4390,
        "longitude": 78.3800,
        "status": "STANDBY",
        "specialties": ["Perimeter Security", "Basic Life Support", "Hazard Mitigation"],
        "isSimulation": True
    },
    {
        "id": "DRT-HYD-04",
        "name": "DRT-Hyderabad-Delta",
        "type": "Disaster Rescue Team",
        "tier": "Heavy Urban Search & Rescue",
        "vehicle": "Amphibious Inundation Rescue Vehicle",
        "crewSize": 8,
        "baseLocation": "South Sector Water Rescue Depot",
        "latitude": 17.3700,
        "longitude": 78.4800,
        "status": "STANDBY",
        "specialties": ["Flood Extraction", "Structural Collapse SAR", "Drone Reconnaissance"],
        "isSimulation": True
    }
]

STANDARD_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "HOSP-APOLLO",
        "name": "Apollo Emergency & Trauma Care, Hyderabad",
        "tier": "Level 1 Trauma Center",
        "address": "Road No. 72, Jubilee Hills, Hyderabad",
        "latitude": 17.4260,
        "longitude": 78.4120,
        "emergencyBedsTotal": 50,
        "emergencyBedsAvailable": 14,
        "icuBedsAvailable": 6,
        "bloodBankStatus": "OPTIMAL",
        "helipadAvailable": True,
        "contact": "+91 40 2360 7777 (Simulated)",
        "isSimulation": True
    },
    {
        "id": "HOSP-KIMS",
        "name": "KIMS Regional Trauma Center, Hyderabad",
        "tier": "Level 2 Trauma Center",
        "address": "1-8-31/1, Minister Road, Secunderabad",
        "latitude": 17.4374,
        "longitude": 78.4870,
        "emergencyBedsTotal": 40,
        "emergencyBedsAvailable": 9,
        "icuBedsAvailable": 4,
        "bloodBankStatus": "ADEQUATE",
        "helipadAvailable": False,
        "contact": "+91 40 4488 5000 (Simulated)",
        "isSimulation": True
    },
    {
        "id": "HOSP-MUNICIPAL",
        "name": "City Municipal Hospital & Health Care",
        "tier": "Community Emergency Facility",
        "address": "Abids Road, Nampally, Hyderabad",
        "latitude": 17.3912,
        "longitude": 78.4735,
        "emergencyBedsTotal": 30,
        "emergencyBedsAvailable": 18,
        "icuBedsAvailable": 2,
        "bloodBankStatus": "STANDBY",
        "helipadAvailable": False,
        "contact": "+91 40 2474 0123 (Simulated)",
        "isSimulation": True
    }
]
