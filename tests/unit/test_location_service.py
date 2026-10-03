import pytest
import os
import sys

# Ensure backend is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from common.location_service import (
    haversine_distance_km,
    calculate_emergency_route,
    evaluate_incident_geofence,
    reverse_geocode_coordinates,
    GEO_HUBS
)


def test_haversine_distance():
    """Verify great circle distance calculation between known coordinates."""
    # Charminar (17.3616, 78.4747) to Secunderabad Station (17.4399, 78.4983) is approx 9-10 km
    dist = haversine_distance_km(17.3616, 78.4747, 17.4399, 78.4983)
    assert 8.0 < dist < 12.0


def test_calculate_emergency_route():
    """Verify road routing calculator returns geometry, distance, and turn steps."""
    dep = [78.4080, 17.4123] # Jubilee Hills
    dest = [78.4983, 17.4399] # Secunderabad
    
    route = calculate_emergency_route(dep, dest, travel_mode="Truck")
    assert route["roadDistanceKm"] > route["straightLineKm"]
    assert route["durationMinutes"] > 0
    assert len(route["routeGeometry"]) > 5
    assert len(route["turnSteps"]) >= 4
    assert route["travelMode"] == "Truck"
    assert route["calculator"] == "AmazonLocationService::RouteCalculator"
    assert route["region"] == "ap-south-1"


def test_evaluate_incident_geofence_outside():
    """Verify status is EN_ROUTE_OUTSIDE when responder is far (> 500m)."""
    incident_pos = [78.4983, 17.4399]
    responder_pos = [78.4080, 17.4123] # ~12 km away
    
    res = evaluate_incident_geofence("INC-100", responder_pos, incident_pos, radius_meters=500)
    assert res["status"] == "EN_ROUTE_OUTSIDE"
    assert res["eventType"] == "NONE"
    assert res["perimeterCrossed"] is False
    assert res["currentDistanceMeters"] > 500


def test_evaluate_incident_geofence_perimeter_enter():
    """Verify status is INSIDE_500M_PERIMETER and event is GEOFENCE_ENTER when within 500m."""
    incident_pos = [78.4983, 17.4399]
    # ~300 meters away (approx 0.0025 deg lat diff is ~277m)
    responder_pos = [78.4983, 17.4426]
    
    res = evaluate_incident_geofence("INC-101", responder_pos, incident_pos, radius_meters=500)
    assert res["status"] == "INSIDE_500M_PERIMETER"
    assert res["eventType"] == "GEOFENCE_ENTER"
    assert res["perimeterCrossed"] is True
    assert res["currentDistanceMeters"] <= 500


def test_evaluate_incident_geofence_on_scene():
    """Verify status is ON_SCENE when responder is within 120m."""
    incident_pos = [78.4983, 17.4399]
    # ~50 meters away
    responder_pos = [78.4983, 17.4403]
    
    res = evaluate_incident_geofence("INC-102", responder_pos, incident_pos, radius_meters=500)
    assert res["status"] == "ON_SCENE"
    assert res["eventType"] == "RESPONDER_ON_SCENE"
    assert res["perimeterCrossed"] is True


def test_reverse_geocode_coordinates_known_landmark():
    """Verify coordinates near Secunderabad Station resolve to Secunderabad landmark."""
    # Point very close to Secunderabad Station
    res = reverse_geocode_coordinates(17.4399, 78.4983)
    assert "Secunderabad" in res["locality"]
    assert res["municipality"] == "Greater Hyderabad Municipal Corporation (GHMC)"
    assert res["state"] == "Telangana"
    assert res["country"] == "India"


def test_reverse_geocode_coordinates_fallback():
    """Verify arbitrary outer coordinates resolve to GHMC sector fallback."""
    res = reverse_geocode_coordinates(17.8000, 78.9000)
    assert "Sector Near 17.8000° N, 78.9000° E" in res["formattedAddress"]
    assert res["locality"] == "Hyderabad Urban District"


def test_geo_hubs():
    """Verify standard response hubs and hospitals exist."""
    assert "ERT-HYD-ALPHA" in GEO_HUBS
    assert "FIRE-SEC-01" in GEO_HUBS
    assert "AMB-APOLLO" in GEO_HUBS
