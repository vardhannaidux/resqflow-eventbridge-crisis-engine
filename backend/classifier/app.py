import json
import os
import uuid
import logging
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ.get("TABLE_NAME", "ResQFlowIncidents")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "resqflow-event-bus")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
eventbridge = boto3.client("events")

RESOURCE_CATALOG = {
    "FIRE": {
        "CRITICAL": ["FIRE_RESPONSE_TEAM_ALPHA", "RAPID_WATER_TENDER", "PARAMEDIC_UNIT"],
        "HIGH": ["FIRE_RESPONSE_TEAM_BRAVO", "PARAMEDIC_UNIT"],
        "MEDIUM": ["COMMUNITY_FIRE_PATROL"]
    },
    "MEDICAL": {
        "CRITICAL": ["MOBILE_ICU_AMBULANCE", "TRAUMA_RESPONSE_DOCTORS"],
        "HIGH": ["ADVANCED_LIFE_SUPPORT_UNIT"],
        "MEDIUM": ["BASIC_AMBULANCE_UNIT"]
    },
    "FLOOD": {
        "CRITICAL": ["DISASTER_RESCUE_BOAT_CREW", "AERIAL_RECON_TEAM"],
        "HIGH": ["WATER_RESCUE_SQUAD"],
        "MEDIUM": ["EVACUATION_ASSISTANCE_TEAM"]
    },
    "ACCIDENT": {
        "CRITICAL": ["HEAVY_RESCUE_EXTRICATION_UNIT", "AIR_AMBULANCE"],
        "HIGH": ["HIGHWAY_PATROL_PARAMEDIC_UNIT"],
        "MEDIUM": ["LOCAL_TRAFFIC_POLICE_AND_TOW"]
    },
    "DEFAULT": {
        "CRITICAL": ["SPECIAL_EMERGENCY_TASK_FORCE"],
        "HIGH": ["REGIONAL_FIRST_RESPONDERS"],
        "MEDIUM": ["LOCAL_VOLUNTEER_CORPS"]
    }
}

def classify_incident(incident_type: str, people_affected: int, description: str):
    """
    Deterministic classification logic:
    peopleAffected >= 10 -> CRITICAL
    peopleAffected >= 5  -> HIGH
    otherwise            -> MEDIUM
    """
    if people_affected >= 10:
        severity = "CRITICAL"
        impact_level = "High-impact critical"
    elif people_affected >= 5:
        severity = "HIGH"
        impact_level = "Substantial-impact high priority"
    else:
        severity = "MEDIUM"
        impact_level = "Moderate-impact standard priority"

    type_resources = RESOURCE_CATALOG.get(incident_type, RESOURCE_CATALOG["DEFAULT"])
    recommended_resources = type_resources.get(severity, RESOURCE_CATALOG["DEFAULT"][severity])

    summary = f"{impact_level} {incident_type.lower()} incident affecting {people_affected} person(s). Requires immediate {severity} dispatch protocol."

    return {
        "category": incident_type,
        "severity": severity,
        "summary": summary,
        "recommendedResources": recommended_resources
    }

def lambda_handler(event, context):
    logger.info("Classifier received event: %s", json.dumps(event))

    # EventBridge envelope unpacking
    detail = event.get("detail", {})
    incident_id = detail.get("incidentId")
    incident_type = detail.get("type", "OTHER").upper()
    people_affected = int(detail.get("peopleAffected", 0))
    description = detail.get("description", "")
    correlation_id = detail.get("correlationId", incident_id)

    if not incident_id:
        logger.error("Missing incidentId in event detail: %s", json.dumps(event))
        return {"status": "ERROR", "message": "Missing incidentId"}

    idempotency_key = f"{incident_id}:IncidentClassified:1"

    # Deterministic classification
    classification = classify_incident(incident_type, people_affected, description)
    severity = classification["severity"]
    now_iso = datetime.now(timezone.utc).isoformat()

    logger.info(json.dumps({
        "operation": "Classifier_Execution",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "assignedSeverity": severity,
        "peopleAffected": people_affected,
        "recommendedResources": classification["recommendedResources"]
    }))

    # Update DynamoDB with severity, category, status and idempotency
    try:
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression="SET severity = :sev, #cat = :cat, #st = :st, updatedAt = :u, lastEventId = :eid, #sum = :sum",
            ExpressionAttributeNames={
                "#cat": "category",
                "#st": "status",
                "#sum": "summary"
            },
            ExpressionAttributeValues={
                ":sev": severity,
                ":cat": classification["category"],
                ":st": "CLASSIFIED",
                ":u": now_iso,
                ":eid": idempotency_key,
                ":sum": classification["summary"]
            }
        )
    except ClientError as e:
        logger.error("Failed to update DynamoDB incident %s: %s", incident_id, str(e))
        raise

    # Emit IncidentClassified event to EventBridge
    classified_detail = {
        "incidentId": incident_id,
        "category": classification["category"],
        "severity": severity,
        "summary": classification["summary"],
        "recommendedResources": classification["recommendedResources"],
        "peopleAffected": people_affected,
        "location": detail.get("location", {}),
        "reportedBy": detail.get("reportedBy", "UNKNOWN"),
        "correlationId": correlation_id,
        "idempotencyKey": idempotency_key,
        "classifiedAt": now_iso
    }

    eb_response = eventbridge.put_events(
        Entries=[
            {
                "Source": "resqflow.incident",
                "DetailType": "IncidentClassified",
                "Detail": json.dumps(classified_detail),
                "EventBusName": EVENT_BUS_NAME,
                "Time": datetime.now(timezone.utc)
            }
        ]
    )

    logger.info(json.dumps({
        "operation": "EventBridge_IncidentClassified_Published",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "severity": severity,
        "failedCount": eb_response.get("FailedEntryCount", 0)
    }))

    return {
        "statusCode": 200,
        "body": {
            "incidentId": incident_id,
            "severity": severity,
            "category": classification["category"],
            "summary": classification["summary"],
            "recommendedResources": classification["recommendedResources"]
        }
    }
