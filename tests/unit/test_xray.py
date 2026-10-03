import sys
import os
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

import ingestion.app as ingestion_app

def test_xray_graph_endpoint():
    """Verify GET /xray/graph returns service graph nodes and edges in ap-south-2"""
    event = {
        "httpMethod": "GET",
        "path": "/xray/graph"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "services" in body
    assert len(body["services"]) >= 5
    service_names = [s["Name"] for s in body["services"]]
    assert any("Ingestion" in name for name in service_names)
    assert any("StepFunctions" in s["Type"] or "Workflow" in s["Name"] for s in body["services"])


def test_xray_traces_endpoint():
    """Verify GET /xray/traces returns distributed trace summaries with duration and status"""
    event = {
        "httpMethod": "GET",
        "path": "/xray/traces"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "traces" in body
    assert len(body["traces"]) > 0
    first_trace = body["traces"][0]
    assert "id" in first_trace
    assert first_trace["id"].startswith("1-")
    assert "durationMs" in first_trace
    assert "entryPoint" in first_trace


def test_xray_trace_detail_endpoint():
    """Verify GET /xray/traces/{id} returns subsegment waterfall execution timeline"""
    event = {
        "httpMethod": "GET",
        "path": "/xray/traces/1-6abf8592-4bd579bd3a969e1a0bce6514"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "traceId" in body
    assert body["traceId"] == "1-6abf8592-4bd579bd3a969e1a0bce6514"
    assert "duration" in body
    assert "waterfall" in body or "segments" in body
