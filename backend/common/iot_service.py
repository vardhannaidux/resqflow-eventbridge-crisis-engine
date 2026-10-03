"""
ResQFlow — AWS IoT Core Service Integration
Provides MQTT topic handling, IoT Device Registry, Device Shadow tracking,
and IoT Topic Rule evaluation for crisis sensor networks in ap-south-1.
"""

import json
import uuid
from datetime import datetime, timezone
import os

IOT_REGION = "ap-south-1"
IOT_DATA_ENDPOINT = os.environ.get(
    "IOT_DATA_ENDPOINT",
    "https://a1859e76u3gqu4-ats.iot.ap-south-1.amazonaws.com"
)

# Seed IoT Crisis Sensors Mesh
DEFAULT_IOT_DEVICES = [
    {
        "thingName": "IOT-SENSOR-FL-01",
        "thingTypeName": "FloodGaugeSensor",
        "description": "Ultrasonic River Water Level Monitor — Musi River Basin (Puranapul)",
        "sensorType": "FLOOD",
        "status": "ONLINE",
        "battery": 94,
        "rssi": -62,
        "location": {"latitude": 17.3688, "longitude": 78.4563, "zone": "Musi River Basin Sector 1"},
        "metricName": "Water Depth",
        "metricValue": 0.85,
        "threshold": 2.20,
        "unit": "meters",
        "mqttTopic": "resqflow/sensors/flood/IOT-SENSOR-FL-01/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"reading": 0.85, "status": "NOMINAL", "sampleRateSec": 30},
            "desired": {"sampleRateSec": 30, "alarmArmed": True}
        }
    },
    {
        "thingName": "IOT-SENSOR-GAS-02",
        "thingTypeName": "ToxicGasDetector",
        "description": "Electrochemical Toxic & VOC Gas Sensor — Jeedimetla Industrial Area",
        "sensorType": "GAS_LEAK",
        "status": "ONLINE",
        "battery": 88,
        "rssi": -71,
        "location": {"latitude": 17.5141, "longitude": 78.4716, "zone": "Jeedimetla Industrial Corridor"},
        "metricName": "Toxic VOC Concentration",
        "metricValue": 38,
        "threshold": 250,
        "unit": "PPM",
        "mqttTopic": "resqflow/sensors/gas/IOT-SENSOR-GAS-02/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"reading": 38, "status": "SAFE", "fanActive": False},
            "desired": {"fanActive": False, "alarmArmed": True}
        }
    },
    {
        "thingName": "IOT-SENSOR-SEIS-03",
        "thingTypeName": "SeismicAccelerometer",
        "description": "Tri-Axial MEMS Structural Vibration Monitor — Cyber Towers Flyover",
        "sensorType": "STRUCTURAL",
        "status": "ONLINE",
        "battery": 100,
        "rssi": -55,
        "location": {"latitude": 17.4504, "longitude": 78.3808, "zone": "HITEC City Flyover Structural Column"},
        "metricName": "Peak Ground Acceleration",
        "metricValue": 0.04,
        "threshold": 0.35,
        "unit": "g",
        "mqttTopic": "resqflow/sensors/seismic/IOT-SENSOR-SEIS-03/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"reading": 0.04, "status": "NORMAL"},
            "desired": {"calibrationOffset": 0.0}
        }
    },
    {
        "thingName": "IOT-BEACON-SOS-04",
        "thingTypeName": "CivilianSOSBeacon",
        "description": "Public Crisis Panic Button & Hardware Beacon — Charminar Historic Plaza",
        "sensorType": "SOS_BEACON",
        "status": "ONLINE",
        "battery": 97,
        "rssi": -58,
        "location": {"latitude": 17.3616, "longitude": 78.4747, "zone": "Charminar Pedestrian Precinct"},
        "metricName": "Panic State",
        "metricValue": 0,
        "threshold": 1,
        "unit": "TRIGGER_LEVEL",
        "mqttTopic": "resqflow/sensors/sos/IOT-BEACON-SOS-04/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"triggered": False, "sirenActive": False},
            "desired": {"sirenActive": False}
        }
    },
    {
        "thingName": "IOT-DRONE-TLM-05",
        "thingTypeName": "ReconUAVTelemetry",
        "description": "Hexacopter Disaster Reconnaissance Drone — Sector Alpha Autonomous Patrol",
        "sensorType": "DRONE",
        "status": "ONLINE",
        "battery": 76,
        "rssi": -49,
        "location": {"latitude": 17.4399, "longitude": 78.4983, "zone": "Secunderabad Transit Hub Sector"},
        "metricName": "Thermal Heat Signature",
        "metricValue": 31.2,
        "threshold": 65.0,
        "unit": "°C",
        "mqttTopic": "resqflow/sensors/drone/IOT-DRONE-TLM-05/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"thermalC": 31.2, "altitudeMeters": 45, "navMode": "WAYPOINT"},
            "desired": {"navMode": "WAYPOINT", "returnHomeOnBatteryPct": 20}
        }
    },
    {
        "thingName": "IOT-FLEET-AMB-06",
        "thingTypeName": "VehicleVitalsGateway",
        "description": "Advanced Life Support Ambulance Gateway — ERT Hyderabad Primary Unit",
        "sensorType": "FLEET_VITALS",
        "status": "ONLINE",
        "battery": 100,
        "rssi": -52,
        "location": {"latitude": 17.4123, "longitude": 78.4080, "zone": "Jubilee Hills Arterial Route"},
        "metricName": "Mobile Oxygen Reserves",
        "metricValue": 92.0,
        "threshold": 20.0,
        "unit": "% Reserve",
        "mqttTopic": "resqflow/fleet/IOT-FLEET-AMB-06/telemetry",
        "qos": 1,
        "lastHeartbeat": None,
        "shadow": {
            "reported": {"speedKmh": 54, "o2Reserve": 92, "sirenOn": True},
            "desired": {"dispatchId": "INC-7A41"}
        }
    }
]

# In-memory IoT Device Store
IOT_DEVICE_STORE = {d["thingName"]: dict(d) for d in DEFAULT_IOT_DEVICES}

# AWS IoT Topic Rules Engine SQL definitions
IOT_TOPIC_RULES = [
    {
        "ruleName": "ResQFlowCriticalSensorAlertRule",
        "sql": "SELECT deviceId, sensorType, metricName, metricValue, threshold, location, timestamp FROM 'resqflow/sensors/+/+/telemetry' WHERE metricValue >= threshold",
        "description": "Triggers when any sensor reading reaches or exceeds critical danger threshold. Emits SensorThresholdExceeded to EventBridge.",
        "actions": [
            {"type": "EventBridge", "busName": "resqflow-event-bus", "detailType": "SensorThresholdExceeded"},
            {"type": "Lambda", "function": "IngestionFunction", "action": "AutoCreateIncident"}
        ]
    },
    {
        "ruleName": "ResQFlowSOSBeaconTriggerRule",
        "sql": "SELECT * FROM 'resqflow/sensors/sos/+/telemetry' WHERE metricValue = 1 OR emergency = true",
        "description": "Fires immediately upon physical SOS button activation. Automatically routes Tier-1 incident to EventBridge.",
        "actions": [
            {"type": "EventBridge", "busName": "resqflow-event-bus", "detailType": "IncidentReported"},
            {"type": "SNS", "topicArn": "arn:aws:sns:ap-south-2:621962614200:ResQFlowAlerts"}
        ]
    },
    {
        "ruleName": "ResQFlowFleetShadowSyncRule",
        "sql": "SELECT state.reported AS telemetry, topic(3) as unitId FROM '$aws/things/+/shadow/update/accepted'",
        "description": "Tracks sub-second GPS positions and vehicle health vitals in AWS IoT Device Shadow.",
        "actions": [
            {"type": "DynamoDBv2", "tableName": "ResQFlowIncidents", "key": "assignedTeam"}
        ]
    }
]


def get_all_iot_devices():
    """Return all registered IoT devices in the mesh."""
    devices = list(IOT_DEVICE_STORE.values())
    return devices


def get_iot_rules():
    """Return configured AWS IoT Core Rules and MQTT topics schema."""
    return {
        "rules": IOT_TOPIC_RULES,
        "endpoint": IOT_DATA_ENDPOINT,
        "region": IOT_REGION,
        "mqttTopics": [
            "resqflow/sensors/flood/{deviceId}/telemetry",
            "resqflow/sensors/gas/{deviceId}/telemetry",
            "resqflow/sensors/seismic/{deviceId}/telemetry",
            "resqflow/sensors/sos/{deviceId}/telemetry",
            "resqflow/sensors/drone/{deviceId}/telemetry",
            "resqflow/fleet/{deviceId}/telemetry",
            "$aws/things/{thingName}/shadow/update"
        ]
    }


def publish_mqtt_telemetry(payload):
    """
    Ingest an MQTT telemetry packet from an IoT device.
    Evaluates IoT Topic Rules:
    If metricValue >= threshold or emergency is True:
        Returns alertTriggered=True and simulated incident generation details.
    Also publishes to live AWS IoT Core if credentials/endpoint are reachable.
    """
    device_id = payload.get("deviceId") or payload.get("thingName")
    if not device_id or device_id not in IOT_DEVICE_STORE:
        # Fallback to first available or create transient
        device = list(IOT_DEVICE_STORE.values())[0]
        device_id = device["thingName"]
    else:
        device = IOT_DEVICE_STORE[device_id]

    now_iso = datetime.now(timezone.utc).isoformat()
    metric_value = float(payload.get("metricValue", device["metricValue"]))
    threshold = float(payload.get("threshold", device["threshold"]))
    is_emergency = bool(payload.get("emergency", False)) or (metric_value >= threshold and threshold > 0)
    
    # Update device state in memory
    device["metricValue"] = metric_value
    device["lastHeartbeat"] = now_iso
    device["shadow"]["reported"]["reading"] = metric_value
    device["shadow"]["reported"]["status"] = "CRITICAL_ALERT" if is_emergency else "NOMINAL"
    if "battery" in payload:
        device["battery"] = int(payload["battery"])

    # Attempt live MQTT publication to AWS IoT Core
    mqtt_published = False
    aws_request_id = None
    try:
        import boto3
        iot_client = boto3.client("iot-data", region_name=IOT_REGION, endpoint_url=IOT_DATA_ENDPOINT)
        topic = device.get("mqttTopic", f"resqflow/sensors/{device_id}/telemetry")
        res = iot_client.publish(
            topic=topic,
            qos=1,
            payload=json.dumps({
                "deviceId": device_id,
                "metricName": device["metricName"],
                "metricValue": metric_value,
                "threshold": threshold,
                "unit": device["unit"],
                "location": device["location"],
                "alert": is_emergency,
                "timestamp": now_iso
            })
        )
        mqtt_published = True
        aws_request_id = res.get("ResponseMetadata", {}).get("RequestId")
    except Exception:
        # Graceful fallback when running in local sandbox or without IoT credentials
        mqtt_published = False
        aws_request_id = f"sim-{uuid.uuid4().hex[:8]}"

    # IoT Rules Engine evaluation
    result = {
        "deviceId": device_id,
        "sensorType": device["sensorType"],
        "metricValue": metric_value,
        "threshold": threshold,
        "unit": device["unit"],
        "isEmergency": is_emergency,
        "mqttPublished": mqtt_published,
        "awsRequestId": aws_request_id,
        "topic": device["mqttTopic"],
        "timestamp": now_iso,
        "matchedRule": "ResQFlowCriticalSensorAlertRule" if is_emergency else None
    }

    if is_emergency:
        # Formulate automatic incident payload
        incident_type_map = {
            "FLOOD": "FLOOD",
            "GAS_LEAK": "HAZMAT",
            "STRUCTURAL": "EARTHQUAKE",
            "SOS_BEACON": "MEDICAL",
            "DRONE": "FIRE",
            "FLEET_VITALS": "MEDICAL"
        }
        incident_type = incident_type_map.get(device["sensorType"], "ACCIDENT")
        incident_desc = (
            f"[AWS IoT Core Alert: {device['thingName']}] Critical breach detected on topic "
            f"'{device['mqttTopic']}'. Reading: {metric_value} {device['unit']} "
            f"(Safety Threshold: {threshold} {device['unit']}). Location: {device['location']['zone']}."
        )

        result["incidentPayload"] = {
            "type": incident_type,
            "description": incident_desc,
            "location": {
                "latitude": device["location"]["latitude"],
                "longitude": device["location"]["longitude"]
            },
            "peopleAffected": 15 if device["sensorType"] in ["FLOOD", "GAS_LEAK"] else 4,
            "reportedBy": f"AWS_IOT_CORE:{device['thingName']}",
            "source": "AWS_IOT_CORE",
            "sensorTelemetry": {
                "deviceId": device_id,
                "metricName": device["metricName"],
                "metricValue": metric_value,
                "threshold": threshold,
                "unit": device["unit"],
                "topic": device["mqttTopic"]
            }
        }

    return result


def update_device_shadow(device_id, desired_state):
    """Update an IoT device shadow desired state."""
    if device_id not in IOT_DEVICE_STORE:
        raise ValueError(f"Device {device_id} not found in IoT registry")

    device = IOT_DEVICE_STORE[device_id]
    device["shadow"]["desired"].update(desired_state)

    # Attempt to update via boto3
    try:
        import boto3
        iot_client = boto3.client("iot-data", region_name=IOT_REGION, endpoint_url=IOT_DATA_ENDPOINT)
        iot_client.update_thing_shadow(
            thingName=device_id,
            payload=json.dumps({"state": {"desired": desired_state}})
        )
    except Exception:
        pass

    return device["shadow"]
