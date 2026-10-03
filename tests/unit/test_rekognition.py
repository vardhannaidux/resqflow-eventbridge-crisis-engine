import pytest
import os
import sys
from unittest.mock import MagicMock, patch

# Ensure backend is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from common.rekognition_service import analyze_incident_image, get_curated_samples, CURATED_SAMPLE_IMAGES


def test_get_curated_samples():
    """Verify curated disaster scenarios return complete metadata."""
    samples = get_curated_samples()
    assert len(samples) >= 4
    sample_ids = [s["id"] for s in samples]
    assert "sample-fire-01" in sample_ids
    assert "sample-flood-02" in sample_ids
    assert "sample-accident-03" in sample_ids
    assert "sample-false-alarm-04" in sample_ids

    for sample in samples:
        assert "incidentType" in sample
        assert "simulatedLabels" in sample
        assert len(sample["simulatedLabels"]) > 0


def test_analyze_incident_image_fallback_fire():
    """Test fallback heuristic analysis for FIRE scenario."""
    result = analyze_incident_image(reported_type="FIRE")
    assert result["reportedType"] == "FIRE"
    assert result["detectedCategory"] == "FIRE"
    assert result["verifiedMatch"] is True
    assert result["visualSeverity"] in ["HIGH", "CRITICAL"]
    assert result["antiSpoofingStatus"] == "PASSED"
    assert len(result["labels"]) > 0
    assert len(result["topTags"]) > 0
    assert "analysisId" in result


def test_analyze_incident_image_fallback_flood():
    """Test fallback heuristic analysis for FLOOD scenario."""
    result = analyze_incident_image(reported_type="FLOOD")
    assert result["reportedType"] == "FLOOD"
    assert result["detectedCategory"] == "FLOOD"
    assert result["verifiedMatch"] is True
    assert result["visualSeverity"] in ["HIGH", "CRITICAL"]


def test_analyze_incident_image_discrepancy_and_anti_spoofing():
    """Test anti-spoofing flags when citizen uploads unrelated photo (cat/plant) for FIRE."""
    cat_plant_labels = [
        {"Name": "Cat", "Confidence": 98.0, "Parents": []},
        {"Name": "Houseplant", "Confidence": 95.0, "Parents": []}
    ]
    with patch("boto3.client") as mock_boto:
        mock_rekog = MagicMock()
        mock_rekog.detect_labels.return_value = {"Labels": cat_plant_labels}
        mock_boto.return_value = mock_rekog

        result = analyze_incident_image(image_bytes=b"fake-cat-image-bytes", reported_type="FIRE")
        assert result["detectedCategory"] == "NON_EMERGENCY"
        assert result["verifiedMatch"] is False
        assert result["antiSpoofingStatus"] == "DISCREPANCY_FLAGGED"
        assert result["visualSeverity"] == "NONE"
        assert "Dispatcher visual verification advised" in result["recommendation"]


def test_analyze_incident_image_live_boto3_mock():
    """Test live AWS Rekognition integration with mocked client."""
    mock_labels = [
        {"Name": "Fire", "Confidence": 99.2, "Parents": [{"Name": "Flame"}]},
        {"Name": "Smoke", "Confidence": 98.7, "Parents": []},
        {"Name": "Building", "Confidence": 95.0, "Parents": []}
    ]
    with patch("boto3.client") as mock_boto:
        mock_rekog = MagicMock()
        mock_rekog.detect_labels.return_value = {"Labels": mock_labels}
        mock_boto.return_value = mock_rekog

        result = analyze_incident_image(image_bytes=b"real-image-payload", reported_type="FIRE")
        assert result["isLiveAWS"] is True
        assert result["detectedCategory"] == "FIRE"
        assert result["visualSeverity"] == "CRITICAL"
        assert result["verifiedMatch"] is True
        assert result["antiSpoofingStatus"] == "PASSED"
        mock_rekog.detect_labels.assert_called_once()
