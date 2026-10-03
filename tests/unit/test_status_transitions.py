import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from common.models import (
    VALID_STATUSES,
    VALID_TRANSITIONS,
    validate_status_transition,
    calculate_haversine_distance_km
)

def test_valid_statuses_defined():
    assert "REPORTED" in VALID_STATUSES
    assert "CLASSIFIED" in VALID_STATUSES
    assert "DISPATCHED" in VALID_STATUSES
    assert "RESOLVED" in VALID_STATUSES

def test_valid_forward_transitions():
    # REPORTED -> CLASSIFIED
    ok, err = validate_status_transition("REPORTED", "CLASSIFIED")
    assert ok is True
    assert err is None

    # REPORTED -> RESOLVED (Direct cancellation/resolution)
    ok, err = validate_status_transition("REPORTED", "RESOLVED")
    assert ok is True
    assert err is None

    # CLASSIFIED -> DISPATCHED
    ok, err = validate_status_transition("CLASSIFIED", "DISPATCHED")
    assert ok is True
    assert err is None

    # CLASSIFIED -> RESOLVED
    ok, err = validate_status_transition("CLASSIFIED", "RESOLVED")
    assert ok is True
    assert err is None

    # DISPATCHED -> RESOLVED
    ok, err = validate_status_transition("DISPATCHED", "RESOLVED")
    assert ok is True
    assert err is None

def test_idempotent_same_state_transition():
    ok, err = validate_status_transition("DISPATCHED", "DISPATCHED")
    assert ok is True
    assert err is None

def test_terminal_resolved_state_rejects_modifications():
    # Cannot reopen or transition out of RESOLVED
    ok, err = validate_status_transition("RESOLVED", "REPORTED")
    assert ok is False
    assert "already been RESOLVED" in err

    ok, err = validate_status_transition("RESOLVED", "CLASSIFIED")
    assert ok is False
    assert "already been RESOLVED" in err

    ok, err = validate_status_transition("RESOLVED", "DISPATCHED")
    assert ok is False
    assert "already been RESOLVED" in err

def test_invalid_backward_transitions():
    # DISPATCHED cannot go back to REPORTED
    ok, err = validate_status_transition("DISPATCHED", "REPORTED")
    assert ok is False
    assert "Invalid state transition" in err

    # CLASSIFIED cannot go back to REPORTED
    ok, err = validate_status_transition("CLASSIFIED", "REPORTED")
    assert ok is False
    assert "Invalid state transition" in err

def test_invalid_status_strings():
    ok, err = validate_status_transition("REPORTED", "NON_EXISTENT_STATUS")
    assert ok is False
    assert "Invalid status" in err

def test_haversine_distance_calculation():
    # Known distance: Charminar (17.3616, 78.4747) to Secunderabad Station (17.4344, 78.5015) is ~8.5-9.0 km straight line
    dist = calculate_haversine_distance_km(17.3616, 78.4747, 17.4344, 78.5015)
    assert 8.0 < dist < 9.5
    # Same point distance should be zero
    zero_dist = calculate_haversine_distance_km(17.3850, 78.4867, 17.3850, 78.4867)
    assert zero_dist == 0.0
