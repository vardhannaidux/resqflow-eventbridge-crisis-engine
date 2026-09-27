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

TEAM_ALLOCATION = {
    "CRITICAL": {
        "team": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
        "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
        "etaMinutes": 8
    },
    "HIGH": {
        "team": "PRT-Hyderabad-Bravo (Priority Tactical Unit)",
        "hospital": "KIMS Regional Trauma Center, Hyderabad",
        "etaMinutes": 15
    },
    "MEDIUM": {
        "team": "SRT-Hyderabad-Charlie (Standard First Responder)",
        "hospital": "City Municipal Hospital & Health Care",
        "etaMinutes": 25
    }
}

def allocate_resources(incident_id: str, severity: str, category: str, location: dict, correlation_id: str):
    sev_upper = severity.upper() if severity else "MEDIUM"
    assignment = TEAM_ALLOCATION.get(sev_upper, TEAM_ALLOCATION["MEDIUM"])
    now_iso = datetime.now(timezone.utc).isoformat()
    idempotency_key = f"{incident_id}:ResourceAllocated:1"

    logger.info(json.dumps({
        "operation": "Resource_Allocation_Logic",
        "incidentId": incident_id,
        "severity": sev_upper,
        "team": assignment["team"],
        "hospital": assignment["hospital"]
    }))

    # Update DynamoDB
    table.update_item(
        Key={"incidentId": incident_id},
        UpdateExpression="SET assignedTeam = :team, hospital = :hosp, #st = :st, updatedAt = :u, lastEventId = :eid, etaMinutes = :eta",
        ExpressionAttributeNames={
            "#st": "status"
        },
        ExpressionAttributeValues={
            ":team": assignment["team"],
            ":hosp": assignment["hospital"],
            ":st": "DISPATCHED",
            ":u": now_iso,
            ":eid": idempotency_key,
            ":eta": assignment["etaMinutes"]
        }
    )

    # 1. Publish ResourceAllocated Event
    allocated_detail = {
        "incidentId": incident_id,
        "severity": sev_upper,
        "category": category,
        "assignedTeam": assignment["team"],
        "hospital": assignment["hospital"],
        "etaMinutes": assignment["etaMinutes"],
        "location": location,
        "correlationId": correlation_id,
        "idempotencyKey": idempotency_key,
        "allocatedAt": now_iso
    }

    eventbridge.put_events(
        Entries=[
            {
                "Source": "resqflow.incident",
                "DetailType": "ResourceAllocated",
                "Detail": json.dumps(allocated_detail),
                "EventBusName": EVENT_BUS_NAME,
                "Time": datetime.now(timezone.utc)
            }
        ]
    )

    # 2. Publish TeamDispatched Event
    dispatched_detail = {
        "incidentId": incident_id,
        "assignedTeam": assignment["team"],
        "hospital": assignment["hospital"],
        "status": "DISPATCHED",
        "etaMinutes": assignment["etaMinutes"],
        "correlationId": correlation_id,
        "idempotencyKey": f"{incident_id}:TeamDispatched:1",
        "dispatchedAt": now_iso
    }

    eventbridge.put_events(
        Entries=[
            {
                "Source": "resqflow.incident",
                "DetailType": "TeamDispatched",
                "Detail": json.dumps(dispatched_detail),
                "EventBusName": EVENT_BUS_NAME,
                "Time": datetime.now(timezone.utc)
            }
        ]
    )

    return {
        "incidentId": incident_id,
        "severity": sev_upper,
        "assignedTeam": assignment["team"],
        "hospital": assignment["hospital"],
        "etaMinutes": assignment["etaMinutes"],
        "status": "DISPATCHED"
    }

def lambda_handler(event, context):
    logger.info("Resource allocation received: %s", json.dumps(event))

    # Support invocation from Step Functions direct input or EventBridge
    detail = event.get("detail") or event
    incident_id = detail.get("incidentId")
    severity = detail.get("severity", "MEDIUM")
    category = detail.get("category", detail.get("type", "GENERAL"))
    location = detail.get("location", {})
    correlation_id = detail.get("correlationId", incident_id)

    if not incident_id:
        raise ValueError("Missing incidentId in resource allocation payload")

    result = allocate_resources(incident_id, severity, category, location, correlation_id)
    return {
        "statusCode": 200,
        "body": result
    }
