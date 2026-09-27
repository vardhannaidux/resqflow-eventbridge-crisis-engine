import json
import os
import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
TABLE_NAME = os.environ.get("TABLE_NAME", "ResQFlowIncidents")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "resqflow-event-bus")

# Boto3 clients
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
eventbridge = boto3.client("events")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT"
}

ALLOWED_TYPES = {"FIRE", "FLOOD", "MEDICAL", "ACCIDENT", "EARTHQUAKE", "OTHER"}

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def validate_input(payload):
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

    reported_by = payload.get("reportedBy", "USER-001")

    cleaned = {
        "type": incident_type_upper,
        "description": description.strip(),
        "peopleAffected": int(people_affected),
        "latitude": Decimal(str(lat)),
        "longitude": Decimal(str(lon)),
        "reportedBy": str(reported_by).strip()
    }
    return True, None, cleaned

def handle_create_incident(body):
    is_valid, err_msg, cleaned = validate_input(body)
    if not is_valid:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": err_msg, "code": "VALIDATION_ERROR"})
        }

    now_iso = datetime.now(timezone.utc).isoformat()
    random_suffix = uuid.uuid4().hex[:6].upper()
    incident_id = f"INC-{random_suffix}"
    correlation_id = incident_id
    idempotency_key = f"{incident_id}:IncidentReported:1"

    # DynamoDB Item definition according to specification
    item = {
        "incidentId": incident_id,
        "type": cleaned["type"],
        "description": cleaned["description"],
        "severity": "UNKNOWN",
        "status": "REPORTED",
        "peopleAffected": cleaned["peopleAffected"],
        "latitude": cleaned["latitude"],
        "longitude": cleaned["longitude"],
        "reportedBy": cleaned["reportedBy"],
        "assignedTeam": "NONE",
        "hospital": "NONE",
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "version": 1,
        "lastEventId": idempotency_key
    }

    logger.info(json.dumps({
        "operation": "DynamoDB_PutItem",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "status": "STARTING"
    }))

    table.put_item(Item=item)

    # EventBridge Event detail according to specification
    event_detail = {
        "incidentId": incident_id,
        "type": cleaned["type"],
        "description": cleaned["description"],
        "severity": "UNKNOWN",
        "peopleAffected": cleaned["peopleAffected"],
        "location": {
            "latitude": float(cleaned["latitude"]),
            "longitude": float(cleaned["longitude"])
        },
        "reportedBy": cleaned["reportedBy"],
        "correlationId": correlation_id,
        "idempotencyKey": idempotency_key
    }

    event_envelope = {
        "version": "1.0",
        "id": str(uuid.uuid4()),
        "source": "resqflow.incident",
        "detail-type": "IncidentReported",
        "time": now_iso,
        "detail": event_detail
    }

    logger.info(json.dumps({
        "operation": "EventBridge_PutEvents",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "detailType": "IncidentReported",
        "status": "PUBLISHING"
    }))

    eb_response = eventbridge.put_events(
        Entries=[
            {
                "Source": "resqflow.incident",
                "DetailType": "IncidentReported",
                "Detail": json.dumps(event_detail),
                "EventBusName": EVENT_BUS_NAME,
                "Time": datetime.now(timezone.utc)
            }
        ]
    )

    logger.info(json.dumps({
        "operation": "IncidentReported_Success",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "eventBridgeResult": str(eb_response.get("FailedEntryCount", 0))
    }))

    response_payload = {
        "message": "Incident successfully reported and queued for classification",
        "incidentId": incident_id,
        "status": "REPORTED",
        "severity": "UNKNOWN",
        "correlationId": correlation_id,
        "createdAt": now_iso
    }

    return {
        "statusCode": 201,
        "headers": CORS_HEADERS,
        "body": json.dumps(response_payload)
    }

def handle_get_incidents():
    """Returns all incidents from DynamoDB for the React dashboard."""
    scan_result = table.scan(Limit=50)
    items = scan_result.get("Items", [])
    # Sort items by createdAt descending
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({"incidents": items}, default=decimal_serializer)
    }

def handle_get_incident_by_id(incident_id):
    """Returns a specific incident by ID."""
    response = table.get_item(Key={"incidentId": incident_id})
    item = response.get("Item")
    if not item:
        return {
            "statusCode": 404,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Incident {incident_id} not found"})
        }
    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(item, default=decimal_serializer)
    }

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    http_method = event.get("httpMethod") or (event.get("requestContext", {}).get("http", {}).get("method"))
    path = event.get("path") or event.get("rawPath", "")

    if http_method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if http_method == "POST":
        raw_body = event.get("body", "{}")
        if isinstance(raw_body, str):
            try:
                body = json.loads(raw_body) if raw_body else {}
            except json.JSONDecodeError:
                return {
                    "statusCode": 400,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Malformed JSON in request body", "code": "BAD_REQUEST"})
                }
        else:
            body = raw_body or {}
        return handle_create_incident(body)

    elif http_method == "GET":
        path_parameters = event.get("pathParameters") or {}
        incident_id = path_parameters.get("incidentId")
        if incident_id:
            return handle_get_incident_by_id(incident_id)
        return handle_get_incidents()

    return {
        "statusCode": 405,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": f"Method {http_method} not allowed"})
    }
