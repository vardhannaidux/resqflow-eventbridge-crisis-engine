import sys
import os
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

import ingestion.app as ingestion_app

def test_iot_devices_endpoint():
    """Verify GET /iot/devices returns mesh sensor registry with status & battery"""
    event = {
        "httpMethod": "GET",
        "path": "/iot/devices"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "devices" in body
    assert len(body["devices"]) >= 6
    thing_names = [d["thingName"] for d in body["devices"]]
    assert "IOT-SENSOR-FL-01" in thing_names
    assert "IOT-SENSOR-GAS-02" in thing_names
    assert "IOT-BEACON-SOS-04" in thing_names


def test_iot_rules_endpoint():
    """Verify GET /iot/rules returns AWS IoT topic rules and MQTT topic schemas"""
    event = {
        "httpMethod": "GET",
        "path": "/iot/rules"
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "rules" in body
    assert "endpoint" in body
    assert "mqttTopics" in body
    rule_names = [r["ruleName"] for r in body["rules"]]
    assert "ResQFlowCriticalSensorAlertRule" in rule_names
    assert "ResQFlowSOSBeaconTriggerRule" in rule_names


def test_iot_nominal_telemetry_no_alert():
    """Verify nominal sensor telemetry updates device without triggering an emergency incident"""
    event = {
        "httpMethod": "POST",
        "path": "/iot/telemetry",
        "body": json.dumps({
            "deviceId": "IOT-SENSOR-FL-01",
            "metricValue": 1.10,
            "threshold": 2.20
        })
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["deviceId"] == "IOT-SENSOR-FL-01"
    assert body["isEmergency"] is False
    assert body["matchedRule"] is None
    assert "incidentId" not in body


def test_iot_critical_threshold_breach_triggers_incident():
    """Verify critical sensor threshold breach triggers IoT Topic Rule and auto-ingests an incident"""
    event = {
        "httpMethod": "POST",
        "path": "/iot/telemetry",
        "body": json.dumps({
            "deviceId": "IOT-SENSOR-GAS-02",
            "metricValue": 480.0,
            "threshold": 250.0,
            "emergency": True
        })
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["deviceId"] == "IOT-SENSOR-GAS-02"
    assert body["isEmergency"] is True
    assert body["matchedRule"] == "ResQFlowCriticalSensorAlertRule"
    assert "incidentPayload" in body
    assert "GAS_LEAK" in body["sensorType"]
    assert "AWS_IOT_CORE" in body["incidentPayload"]["source"]


def test_iot_device_shadow_update():
    """Verify POST /iot/devices/{id}/shadow updates desired state"""
    event = {
        "httpMethod": "POST",
        "path": "/iot/devices/IOT-SENSOR-FL-01/shadow",
        "body": json.dumps({
            "desired": {
                "sampleRateSec": 10,
                "alarmArmed": True
            }
        })
    }
    response = ingestion_app.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["deviceId"] == "IOT-SENSOR-FL-01"
    assert body["shadow"]["desired"]["sampleRateSec"] == 10
