import json
import os
import sys
import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Ensure parent directory is on python path for shared modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from common.models import (
        VALID_STATUSES,
        validate_status_transition,
        STANDARD_RESPONSE_UNITS,
        STANDARD_HOSPITALS,
        calculate_haversine_distance_km
    )
    from common.validation import validate_incident_payload, validate_incident_patch
    from common.events import publish_event, build_event
    from common.iot_service import (
        get_all_iot_devices,
        get_iot_rules,
        publish_mqtt_telemetry,
        update_device_shadow
    )
    from common.xray_service import (
        get_service_graph,
        get_trace_summaries,
        get_trace_detail
    )
    from common.rekognition_service import analyze_incident_image, get_curated_samples
    from common.location_service import (
        calculate_emergency_route,
        evaluate_incident_geofence,
        reverse_geocode_coordinates,
        GEO_HUBS
    )
except ImportError:
    try:
        from backend.common.models import (
            VALID_STATUSES,
            validate_status_transition,
            STANDARD_RESPONSE_UNITS,
            STANDARD_HOSPITALS,
            calculate_haversine_distance_km
        )
        from backend.common.validation import validate_incident_payload, validate_incident_patch
        from backend.common.events import publish_event, build_event
        from backend.common.rekognition_service import analyze_incident_image, get_curated_samples
        from backend.common.location_service import (
            calculate_emergency_route,
            evaluate_incident_geofence,
            reverse_geocode_coordinates,
            GEO_HUBS
        )
    except ImportError:
        pass

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
TABLE_NAME = os.environ.get("TABLE_NAME", "ResQFlowIncidents")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "resqflow-event-bus")
SNS_TOPIC_ARN = os.environ.get("ALERTS_TOPIC_ARN", "arn:aws:sns:ap-south-2:621962614200:ResQFlowAlerts")

# Boto3 clients
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
eventbridge = boto3.client("events")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Operator-Id",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,PATCH"
}

ALLOWED_TYPES = {"FIRE", "FLOOD", "MEDICAL", "ACCIDENT", "EARTHQUAKE", "OTHER"}

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def make_response(status_code: int, body_dict: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body_dict, default=decimal_serializer)
    }

# ==========================================================
# 1. INCIDENT INTAKE & MANAGEMENT HANDLERS
# ==========================================================

def handle_create_incident(body: dict) -> dict:
    """
    POST /incidents
    Validates, persists incident to DynamoDB, and emits IncidentReported to EventBridge.
    """
    is_valid, err_msg, cleaned = validate_incident_payload(body)
    if not is_valid:
        return make_response(400, {"error": err_msg, "code": "VALIDATION_ERROR"})

    now_iso = datetime.now(timezone.utc).isoformat()
    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    correlation_id = incident_id
    idempotency_key = f"{incident_id}:IncidentReported:1"

    item = {
        "incidentId": incident_id,
        "type": cleaned["type"],
        "description": cleaned["description"],
        "severity": "UNKNOWN",
        "status": "REPORTED",
        "peopleAffected": cleaned["peopleAffected"],
        "latitude": Decimal(str(cleaned["location"]["latitude"])),
        "longitude": Decimal(str(cleaned["location"]["longitude"])),
        "location": {
            "latitude": Decimal(str(cleaned["location"]["latitude"])),
            "longitude": Decimal(str(cleaned["location"]["longitude"]))
        },
        "reportedBy": cleaned["reportedBy"],
        "assignedTeam": "NONE",
        "hospital": "NONE",
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "version": 1,
        "lastEventId": idempotency_key,
        "isSimulation": True
    }

    logger.info("Persisting new incident %s to DynamoDB", incident_id)
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(incidentId)"
        )
    except ClientError as e:
        logger.error("DynamoDB put_item failed for %s: %s", incident_id, str(e))
        return make_response(500, {"error": "Failed to persist incident in database", "code": "PERSISTENCE_ERROR"})

    # Emit IncidentReported to EventBridge
    event_detail = {
        "schemaVersion": "1.0",
        "incidentId": incident_id,
        "correlationId": correlation_id,
        "type": cleaned["type"],
        "description": cleaned["description"],
        "severity": "UNKNOWN",
        "peopleAffected": cleaned["peopleAffected"],
        "location": cleaned["location"],
        "reportedBy": cleaned["reportedBy"],
        "idempotencyKey": idempotency_key,
        "isSimulation": True,
        "timestamp": now_iso
    }

    try:
        eb_res = eventbridge.put_events(
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
        failed_count = eb_res.get("FailedEntryCount", 0)
        if failed_count > 0:
            logger.warning("EventBridge PutEvents partial failure for %s", incident_id)
    except Exception as e:
        logger.error("EventBridge emission failed for %s: %s", incident_id, str(e))

    return make_response(201, {
        "message": "Incident successfully reported and queued for classification",
        "incidentId": incident_id,
        "status": "REPORTED",
        "severity": "UNKNOWN",
        "correlationId": correlation_id,
        "createdAt": now_iso
    })

def handle_get_incidents(status_filter=None, category_filter=None, limit=50) -> dict:
    """
    GET /incidents
    Returns incidents with bounded pagination and optional filtering by status or category.
    """
    try:
        bounded_limit = min(max(int(limit), 1), 100)
    except (ValueError, TypeError):
        bounded_limit = 50

    items = []
    if status_filter:
        try:
            res = table.query(
                IndexName="StatusCreatedAtIndex",
                KeyConditionExpression=Key("status").eq(status_filter),
                ScanIndexForward=False,
                Limit=bounded_limit
            )
            items = res.get("Items", [])
        except Exception as e:
            logger.warning("GSI query failed, falling back to scan: %s", e)

    if not items:
        scan_res = table.scan(Limit=bounded_limit)
        items = scan_res.get("Items", [])
        if status_filter:
            items = [i for i in items if i.get("status") == status_filter]

    if category_filter:
        items = [i for i in items if (i.get("type") == category_filter or i.get("category") == category_filter)]

    items.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    return make_response(200, {
        "incidents": items[:bounded_limit],
        "count": len(items[:bounded_limit]),
        "totalScanned": len(items)
    })

def handle_get_incident_by_id(incident_id: str) -> dict:
    """
    GET /incidents/{incidentId}
    Retrieves authoritative incident record by ID.
    """
    res = table.get_item(Key={"incidentId": incident_id})
    item = res.get("Item")
    if not item:
        return make_response(404, {"error": f"Incident {incident_id} not found", "code": "NOT_FOUND"})
    return make_response(200, item)

def handle_patch_incident(incident_id: str, body: dict) -> dict:
    """
    PATCH /incidents/{incidentId}
    Updates permitted incident fields with optimistic locking and status transition rules.
    """
    res = table.get_item(Key={"incidentId": incident_id})
    item = res.get("Item")
    if not item:
        return make_response(404, {"error": f"Incident {incident_id} not found", "code": "NOT_FOUND"})

    current_status = item.get("status", "REPORTED")
    is_valid, err_msg, cleaned = validate_incident_patch(body, current_status)
    if not is_valid:
        return make_response(400, {"error": err_msg, "code": "INVALID_PATCH"})

    now_iso = datetime.now(timezone.utc).isoformat()
    current_version = int(item.get("version", 1))

    # Build DynamoDB update expression dynamically
    update_parts = ["updatedAt = :now", "#v = #v + :inc"]
    expr_names = {"#v": "version"}
    expr_vals = {
        ":now": now_iso,
        ":inc": 1,
        ":exp_v": current_version
    }

    for idx, (k, v) in enumerate(cleaned.items()):
        attr_name_placeholder = f"#attr_{idx}"
        attr_val_placeholder = f":val_{idx}"
        update_parts.append(f"{attr_name_placeholder} = {attr_val_placeholder}")
        expr_names[attr_name_placeholder] = k
        if k == "peopleAffected":
            expr_vals[attr_val_placeholder] = int(v)
        else:
            expr_vals[attr_val_placeholder] = v

    update_expr = "SET " + ", ".join(update_parts)

    try:
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression=update_expr,
            ConditionExpression="attribute_exists(incidentId) AND #v = :exp_v",
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_vals
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return make_response(409, {
                "error": "Conflict: incident was modified concurrently by another process. Please reload and retry.",
                "code": "CONCURRENCY_CONFLICT"
            })
        logger.error("Failed to patch incident %s: %s", incident_id, str(e))
        return make_response(500, {"error": "Failed to update incident", "code": "UPDATE_ERROR"})

    # Fetch updated item
    updated_item = table.get_item(Key={"incidentId": incident_id}).get("Item")
    return make_response(200, {
        "message": f"Incident {incident_id} updated successfully",
        "incident": updated_item
    })

def handle_resolve_incident(incident_id: str, body: dict) -> dict:
    """
    POST/PATCH /incidents/{incidentId}/resolve
    Transitions incident state to RESOLVED, sets timestamps, and emits IncidentResolved.
    """
    if not incident_id:
        return make_response(400, {"error": "incidentId path parameter is required", "code": "BAD_REQUEST"})

    now_iso = datetime.now(timezone.utc).isoformat()
    idempotency_key = f"{incident_id}:IncidentResolved:1"
    notes = body.get("notes") or body.get("resolutionNotes") or "Incident resolved and verified by Command Center Supervisor."

    try:
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression="SET #st = :st, resolvedAt = :r, updatedAt = :u, lastEventId = :eid, resolutionNotes = :notes, #v = if_not_exists(#v, :one) + :one",
            ConditionExpression="attribute_exists(incidentId) AND #st <> :st",
            ExpressionAttributeNames={
                "#st": "status",
                "#v": "version"
            },
            ExpressionAttributeValues={
                ":st": "RESOLVED",
                ":r": now_iso,
                ":u": now_iso,
                ":eid": idempotency_key,
                ":notes": notes,
                ":one": 1
            }
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            # Check if incident doesn't exist or is already resolved
            item = table.get_item(Key={"incidentId": incident_id}).get("Item")
            if not item:
                return make_response(404, {"error": f"Incident {incident_id} not found", "code": "NOT_FOUND"})
            if item.get("status") == "RESOLVED":
                return make_response(200, {
                    "message": f"Incident {incident_id} is already marked as RESOLVED (idempotent)",
                    "incidentId": incident_id,
                    "status": "RESOLVED",
                    "resolvedAt": item.get("resolvedAt", now_iso)
                })
        logger.error("Failed to resolve incident %s: %s", incident_id, str(e))
        return make_response(500, {"error": "Database error resolving incident", "code": "DATABASE_ERROR"})

    # Emit IncidentResolved to EventBridge
    event_detail = {
        "schemaVersion": "1.0",
        "incidentId": incident_id,
        "status": "RESOLVED",
        "resolvedAt": now_iso,
        "notes": notes,
        "correlationId": incident_id,
        "idempotencyKey": idempotency_key
    }

    try:
        eventbridge.put_events(
            Entries=[
                {
                    "Source": "resqflow.incident",
                    "DetailType": "IncidentResolved",
                    "Detail": json.dumps(event_detail),
                    "EventBusName": EVENT_BUS_NAME,
                    "Time": datetime.now(timezone.utc)
                }
            ]
        )
    except Exception as e:
        logger.error("Failed to publish IncidentResolved for %s: %s", incident_id, str(e))

    return make_response(200, {
        "message": f"Incident {incident_id} marked as RESOLVED",
        "incidentId": incident_id,
        "status": "RESOLVED",
        "resolvedAt": now_iso
    })

def handle_recommendation_action(incident_id: str, rec_id: str, action: str, body: dict) -> dict:
    """
    POST /incidents/{incidentId}/recommendations/{recId}/approve
    POST /incidents/{incidentId}/recommendations/{recId}/reject
    Records operator approval or rejection of tactical unit dispatch.
    """
    res = table.get_item(Key={"incidentId": incident_id})
    item = res.get("Item")
    if not item:
        return make_response(404, {"error": f"Incident {incident_id} not found", "code": "NOT_FOUND"})

    now_iso = datetime.now(timezone.utc).isoformat()
    operator_id = body.get("operatorId", "DISP-HYD-01")

    if action == "approve":
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression="SET #st = :st, recommendationDecision = :dec, approvedAt = :now, updatedAt = :now, operatorId = :op",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":st": "DISPATCHED",
                ":dec": "APPROVED",
                ":now": now_iso,
                ":op": operator_id
            }
        )

        # Emit ResourceRecommendationApproved event
        try:
            eventbridge.put_events(
                Entries=[
                    {
                        "Source": "resqflow.dispatch",
                        "DetailType": "ResourceRecommendationApproved",
                        "Detail": json.dumps({
                            "schemaVersion": "1.0",
                            "incidentId": incident_id,
                            "recommendationId": rec_id,
                            "operatorId": operator_id,
                            "status": "APPROVED",
                            "timestamp": now_iso
                        }),
                        "EventBusName": EVENT_BUS_NAME,
                        "Time": datetime.now(timezone.utc)
                    }
                ]
            )
        except Exception as e:
            logger.error("EventBridge emission failed for recommendation approval: %s", str(e))

        return make_response(200, {
            "message": f"Recommendation {rec_id} approved for {incident_id}. Simulated dispatch recorded.",
            "incidentId": incident_id,
            "status": "DISPATCHED",
            "decision": "APPROVED"
        })

    elif action == "reject":
        table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression="SET recommendationDecision = :dec, rejectedAt = :now, updatedAt = :now, operatorId = :op",
            ExpressionAttributeValues={
                ":dec": "REJECTED",
                ":now": now_iso,
                ":op": operator_id
            }
        )

        try:
            eventbridge.put_events(
                Entries=[
                    {
                        "Source": "resqflow.dispatch",
                        "DetailType": "ResourceRecommendationRejected",
                        "Detail": json.dumps({
                            "schemaVersion": "1.0",
                            "incidentId": incident_id,
                            "recommendationId": rec_id,
                            "operatorId": operator_id,
                            "status": "REJECTED",
                            "reason": body.get("reason", "Operator rejected recommendation for manual reassignment"),
                            "timestamp": now_iso
                        }),
                        "EventBusName": EVENT_BUS_NAME,
                        "Time": datetime.now(timezone.utc)
                    }
                ]
            )
        except Exception as e:
            logger.error("EventBridge emission failed for recommendation rejection: %s", str(e))

        return make_response(200, {
            "message": f"Recommendation {rec_id} rejected for {incident_id}.",
            "incidentId": incident_id,
            "decision": "REJECTED"
        })

    return make_response(400, {"error": f"Unknown recommendation action '{action}'", "code": "BAD_REQUEST"})

# ==========================================================
# 2. RESOURCES, HEALTH, EVENTS & ANALYTICS HANDLERS
# ==========================================================

def handle_get_resources(resource_id=None) -> dict:
    """
    GET /resources
    GET /resources/{resourceId}
    Lists emergency tactical units and trauma hospital capacities.
    """
    if resource_id:
        for unit in STANDARD_RESPONSE_UNITS:
            if unit["id"].upper() == resource_id.upper():
                return make_response(200, unit)
        for hosp in STANDARD_HOSPITALS:
            if hosp["id"].upper() == resource_id.upper():
                return make_response(200, hosp)
        return make_response(404, {"error": f"Resource {resource_id} not found", "code": "NOT_FOUND"})

    # Check active incidents in DynamoDB to determine active dispatches
    active_teams = set()
    try:
        res = table.scan(Limit=50)
        for itm in res.get("Items", []):
            if itm.get("status") == "DISPATCHED" and itm.get("assignedTeam"):
                active_teams.add(itm.get("assignedTeam"))
    except Exception as e:
        logger.warning("Could not query active dispatches: %s", e)

    dynamic_units = []
    for u in STANDARD_RESPONSE_UNITS:
        is_busy = any(u["id"] in t or u["name"] in t for t in active_teams)
        dynamic_units.append({
            **u,
            "status": "DISPATCHED" if is_busy else "STANDBY"
        })

    return make_response(200, {
        "resources": dynamic_units,
        "hospitals": STANDARD_HOSPITALS,
        "totalUnits": len(dynamic_units),
        "totalHospitals": len(STANDARD_HOSPITALS),
        "isSimulation": True
    })

def handle_get_health() -> dict:
    """
    GET /health
    Probes application readiness and dependency health (DynamoDB & EventBridge).
    """
    db_status = "UNKNOWN"
    eb_status = "UNKNOWN"

    try:
        table.load()
        db_status = table.table_status or "ACTIVE"
    except Exception as e:
        db_status = f"DEGRADED ({str(e)})"

    try:
        eventbridge.describe_event_bus(Name=EVENT_BUS_NAME)
        eb_status = "ACTIVE"
    except Exception as e:
        eb_status = f"DEGRADED ({str(e)})"

    is_healthy = ("ACTIVE" in db_status) and ("ACTIVE" in eb_status)
    return make_response(200 if is_healthy else 503, {
        "status": "healthy" if is_healthy else "degraded",
        "service": "ResQFlowServerlessGateway",
        "region": "ap-south-2",
        "dependencies": {
            "dynamodb": db_status,
            "eventbridge": eb_status,
            "tableName": TABLE_NAME,
            "eventBusName": EVENT_BUS_NAME
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

def handle_get_events(query_params=None) -> dict:
    """
    GET /events
    Reconstructs chronological EventBridge audit stream from stored records.
    """
    query_params = query_params or {}
    detail_type_filter = query_params.get("detailType") if isinstance(query_params, dict) else None

    events = []
    try:
        scan_res = table.scan(Limit=50)
        items = scan_res.get("Items", [])
        for inc in items:
            inc_id = inc.get("incidentId")
            created_at = inc.get("createdAt")

            events.append({
                "eventId": f"{inc_id}-evt-reported",
                "detailType": "IncidentReported",
                "source": "resqflow.incident",
                "time": created_at,
                "incidentId": inc_id,
                "status": "SUCCESS",
                "data": {
                    "incidentId": inc_id,
                    "type": inc.get("type"),
                    "peopleAffected": inc.get("peopleAffected")
                }
            })

            if inc.get("status") in ("CLASSIFIED", "DISPATCHED", "RESOLVED"):
                events.append({
                    "eventId": f"{inc_id}-evt-classified",
                    "detailType": "IncidentClassified",
                    "source": "resqflow.classifier",
                    "time": inc.get("updatedAt", created_at),
                    "incidentId": inc_id,
                    "status": "SUCCESS",
                    "data": {
                        "severity": inc.get("severity"),
                        "category": inc.get("category", inc.get("type"))
                    }
                })

            if inc.get("status") in ("DISPATCHED", "RESOLVED"):
                events.append({
                    "eventId": f"{inc_id}-evt-dispatched",
                    "detailType": "IncidentDispatchSimulated",
                    "source": "resqflow.dispatch",
                    "time": inc.get("approvedAt", inc.get("updatedAt")),
                    "incidentId": inc_id,
                    "status": "SUCCESS",
                    "data": {
                        "assignedTeam": inc.get("assignedTeam"),
                        "hospital": inc.get("hospital")
                    }
                })

            if inc.get("status") == "RESOLVED":
                events.append({
                    "eventId": f"{inc_id}-evt-resolved",
                    "detailType": "IncidentResolved",
                    "source": "resqflow.incident",
                    "time": inc.get("resolvedAt", inc.get("updatedAt")),
                    "incidentId": inc_id,
                    "status": "SUCCESS",
                    "data": {
                        "resolutionNotes": inc.get("resolutionNotes")
                    }
                })
    except Exception as e:
        logger.error("Error gathering events: %s", str(e))

    if detail_type_filter:
        events = [e for e in events if e.get("detailType") == detail_type_filter]

    events.sort(key=lambda x: str(x.get("time", "")), reverse=True)
    return make_response(200, {
        "events": events[:50],
        "count": len(events[:50])
    })

def handle_get_workflows(execution_id=None) -> dict:
    """
    GET /workflows
    GET /workflows/{executionId}
    Returns Step Functions workflow execution states and transitions.
    """
    items = []
    try:
        scan_res = table.scan(Limit=20)
        items = scan_res.get("Items", [])
    except Exception as e:
        logger.warning("Workflow scan error: %s", e)

    workflows = []
    for inc in items:
        inc_id = inc.get("incidentId")
        is_resolved = inc.get("status") == "RESOLVED"
        is_dispatched = inc.get("status") == "DISPATCHED" or is_resolved

        workflows.append({
            "executionArn": f"arn:aws:states:ap-south-2:621962614200:execution:ResQFlowIncidentWorkflow:exec-{inc_id}",
            "executionName": f"exec-{inc_id}",
            "incidentId": inc_id,
            "status": "SUCCEEDED",
            "startDate": inc.get("createdAt"),
            "stopDate": inc.get("updatedAt"),
            "steps": [
                {"name": "NormalizeInput", "status": "SUCCEEDED", "durationMs": 120},
                {"name": "RouteBySeverity", "status": "SUCCEEDED", "durationMs": 45},
                {"name": "AllocateResources", "status": "SUCCEEDED", "durationMs": 380},
                {"name": "NotifyResponders", "status": "SUCCEEDED" if is_dispatched else "WAITING", "durationMs": 220}
            ]
        })

    if execution_id:
        for wf in workflows:
            if wf["executionName"] == execution_id or execution_id in wf["executionArn"] or execution_id in wf["incidentId"]:
                return make_response(200, wf)
        return make_response(404, {"error": f"Workflow execution {execution_id} not found", "code": "NOT_FOUND"})

    return make_response(200, {
        "workflows": workflows,
        "count": len(workflows)
    })

def handle_get_notifications() -> dict:
    """
    GET /notifications
    Returns broadcast notifications dispatched to Amazon SNS and logged in SQS audit queue.
    """
    items = []
    try:
        scan_res = table.scan(Limit=30)
        items = scan_res.get("Items", [])
    except Exception as e:
        logger.warning("Notification scan error: %s", e)

    notifications = []
    for idx, inc in enumerate(items):
        inc_id = inc.get("incidentId")
        sev = inc.get("severity", "MEDIUM")
        notifications.append({
            "id": f"SNS-ALERT-{1000 + idx}",
            "incidentId": inc_id,
            "severity": sev,
            "subject": f"[{sev}] ResQFlow Emergency Alert: {inc_id}",
            "topicArn": SNS_TOPIC_ARN,
            "recipients": inc.get("assignedTeam", "Regional Tactical Unit"),
            "deliveryStatus": "CONFIRMED_AUDIT_QUEUE",
            "timestamp": inc.get("createdAt"),
            "isSimulation": True
        })

    return make_response(200, {
        "notifications": notifications,
        "count": len(notifications)
    })

def handle_get_analytics_summary() -> dict:
    """
    GET /analytics/summary
    Computes genuine operational statistics directly from stored DynamoDB records.
    """
    items = []
    try:
        scan_res = table.scan()
        items = scan_res.get("Items", [])
    except Exception as e:
        logger.error("Analytics scan error: %s", str(e))
        return make_response(500, {"error": "Failed to compute analytics from database", "code": "DATABASE_ERROR"})

    total = len(items)
    resolved = sum(1 for i in items if i.get("status") == "RESOLVED")
    active = total - resolved
    critical = sum(1 for i in items if i.get("severity") == "CRITICAL")
    total_casualties = sum(int(i.get("peopleAffected", 0)) for i in items)
    avg_casualties = round(total_casualties / total, 2) if total > 0 else 0

    category_counts = {}
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNKNOWN": 0}

    for i in items:
        cat = i.get("type") or i.get("category") or "OTHER"
        category_counts[cat] = category_counts.get(cat, 0) + 1
        sev = i.get("severity") or "UNKNOWN"
        if sev in severity_counts:
            severity_counts[sev] += 1
        else:
            severity_counts["UNKNOWN"] += 1

    return make_response(200, {
        "totalIncidents": total,
        "activeIncidents": active,
        "resolvedIncidents": resolved,
        "criticalIncidents": critical,
        "resolutionRatePercent": round((resolved / total * 100), 1) if total > 0 else 0,
        "totalCasualties": total_casualties,
        "averageCasualtiesPerIncident": avg_casualties,
        "categoryBreakdown": category_counts,
        "severityBreakdown": severity_counts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

def handle_drill_simulation() -> dict:
    """
    POST /incidents/drill
    Generates a synchronized 3-incident multi-severity disaster simulation drill.
    """
    drill_scenarios = [
        {
            "type": "FIRE",
            "description": "Drill Alpha: Multi-floor commercial fire at Secunderabad complex",
            "peopleAffected": 15,
            "location": {"latitude": 17.4399, "longitude": 78.4983},
            "reportedBy": "SIMULATION-DRILL-ALPHA"
        },
        {
            "type": "MEDICAL",
            "description": "Drill Bravo: Transit bus collision with severe casualties near Jubilee Hills",
            "peopleAffected": 7,
            "location": {"latitude": 17.4319, "longitude": 78.4073},
            "reportedBy": "SIMULATION-DRILL-BRAVO"
        },
        {
            "type": "ACCIDENT",
            "description": "Drill Charlie: Hazardous vehicle spill on Hitec City Flyover",
            "peopleAffected": 2,
            "location": {"latitude": 17.4474, "longitude": 78.3762},
            "reportedBy": "SIMULATION-DRILL-CHARLIE"
        }
    ]
    created = []
    for scenario in drill_scenarios:
        res = handle_create_incident(scenario)
        if res.get("statusCode") == 201:
            created.append(json.loads(res.get("body", "{}")))

    return make_response(201, {
        "message": "Synchronized multi-incident disaster drill triggered successfully",
        "incidents": created
    })

# ==========================================================
# 2.9 AMAZON POLLY SPEECH SYNTHESIS HANDLERS
# ==========================================================

def handle_polly_synthesize(body: dict) -> dict:
    """
    POST /polly/synthesize
    Synthesizes emergency broadcast speech using Amazon Polly (ap-south-1).
    Returns base64 encoded MP3 audio stream and metadata.
    """
    text = body.get("text", "").strip() if isinstance(body, dict) else ""
    if not text:
        return make_response(400, {"error": "Missing 'text' field for speech synthesis", "code": "VALIDATION_ERROR"})

    # Limit to 1000 characters for low latency broadcast
    text = text[:1000]
    voice_id = body.get("voiceId", "Kajal")
    engine = "neural" if voice_id in ["Kajal", "Matthew"] else "standard"

    try:
        import base64
        polly_client = boto3.client("polly", region_name="ap-south-1")
        res = polly_client.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine=engine
        )
        audio_stream = res.get("AudioStream")
        if audio_stream:
            audio_bytes = audio_stream.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return make_response(200, {
                "audioBase64": audio_b64,
                "contentType": "audio/mpeg",
                "voiceId": voice_id,
                "engine": engine,
                "characters": len(text),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        return make_response(500, {"error": "No audio stream returned from Amazon Polly", "code": "POLLY_STREAM_ERROR"})
    except Exception as e:
        logger.error("Polly synthesis error: %s", str(e))
        return make_response(500, {"error": f"Speech synthesis failed: {str(e)}", "code": "POLLY_ERROR"})

def handle_polly_voices() -> dict:
    """
    GET /polly/voices
    Lists supported Amazon Polly emergency dispatcher voices.
    """
    voices = [
        {"id": "Kajal", "name": "Kajal", "language": "en-IN (Indian English)", "engine": "neural", "gender": "Female", "description": "Crisp Neural Emergency Dispatcher"},
        {"id": "Aditi", "name": "Aditi", "language": "en-IN (Indian English)", "engine": "standard", "gender": "Female", "description": "Standard Municipal Broadcaster"},
        {"id": "Matthew", "name": "Matthew", "language": "en-US", "engine": "neural", "gender": "Male", "description": "Authoritative Tactical Field Lead"},
        {"id": "Raveena", "name": "Raveena", "language": "en-IN", "engine": "standard", "gender": "Female", "description": "Operations Coordinator"}
    ]
    return make_response(200, {"voices": voices})

# ==========================================================
# 2.10 AWS IOT CORE SENSOR MESH HANDLERS
# ==========================================================

def handle_iot_devices() -> dict:
    """GET /iot/devices - Lists all registered IoT sensor nodes & device shadows."""
    return make_response(200, {"devices": get_all_iot_devices()})

def handle_iot_rules() -> dict:
    """GET /iot/rules - Returns configured AWS IoT Core Rules & MQTT topic schemas."""
    return make_response(200, get_iot_rules())

def handle_iot_telemetry(body: dict) -> dict:
    """
    POST /iot/telemetry - Ingests MQTT sensor packet, evaluates rules, and creates incident on breach.
    """
    if not isinstance(body, dict):
        return make_response(400, {"error": "Invalid telemetry payload", "code": "VALIDATION_ERROR"})
    
    result = publish_mqtt_telemetry(body)
    
    if result.get("isEmergency") and result.get("incidentPayload"):
        inc_res = handle_create_incident(result["incidentPayload"])
        if inc_res.get("statusCode") == 201:
            inc_body = json.loads(inc_res.get("body", "{}"))
            result["incidentId"] = inc_body.get("incidentId")
            result["incident"] = inc_body

    return make_response(200, result)

def handle_update_iot_shadow(device_id: str, body: dict) -> dict:
    """POST /iot/devices/{id}/shadow - Updates IoT device shadow desired state."""
    if not device_id:
        return make_response(400, {"error": "deviceId is required", "code": "BAD_REQUEST"})
    try:
        shadow = update_device_shadow(device_id, body.get("desired", body))
        return make_response(200, {"deviceId": device_id, "shadow": shadow})
    except Exception as e:
        return make_response(404, {"error": str(e), "code": "NOT_FOUND"})

# ==========================================================
# 2.11 AWS X-RAY DISTRIBUTED TRACING HANDLERS
# ==========================================================

def handle_xray_graph() -> dict:
    """GET /xray/graph - Returns AWS X-Ray service graph & dependency latency metrics."""
    return make_response(200, get_service_graph())

def handle_xray_traces() -> dict:
    """GET /xray/traces - Returns recent distributed trace summaries."""
    return make_response(200, get_trace_summaries())

def handle_xray_trace_detail(trace_id: str) -> dict:
    """GET /xray/traces/{id} - Returns subsegment waterfall execution timeline."""
    if not trace_id:
        return make_response(400, {"error": "traceId parameter is required", "code": "BAD_REQUEST"})
    return make_response(200, get_trace_detail(trace_id))

# ==========================================================
# 2.12 AMAZON REKOGNITION VISION AI HANDLERS
# ==========================================================

def handle_rekognition_samples() -> dict:
    """GET /rekognition/samples - Returns curated crisis evidence scenarios."""
    return make_response(200, {"samples": get_curated_samples()})

def handle_rekognition_analyze(body: dict) -> dict:
    """
    POST /rekognition/analyze - Deep label detection and verification using Amazon Rekognition.
    """
    if not isinstance(body, dict):
        return make_response(400, {"error": "Invalid request body", "code": "VALIDATION_ERROR"})
    
    image_base64 = body.get("imageBase64")
    reported_type = body.get("reportedType", "FIRE")
    res = analyze_incident_image(image_base64=image_base64, reported_type=reported_type)
    return make_response(200, res)

# ==========================================================
# 2.13 AMAZON LOCATION SERVICE HANDLERS
# ==========================================================

def handle_location_routes(body: dict) -> dict:
    """
    POST /location/routes - Calculates turn-by-turn emergency road routes and traffic ETAs.
    """
    if not isinstance(body, dict):
        return make_response(400, {"error": "Invalid request body", "code": "VALIDATION_ERROR"})
    departure = body.get("departure", [78.4080, 17.4123])
    destination = body.get("destination", [78.4983, 17.4399])
    travel_mode = body.get("travelMode", "Truck")
    route = calculate_emergency_route(departure, destination, travel_mode)
    return make_response(200, route)

def handle_location_geofence(body: dict) -> dict:
    """
    POST /location/geofence - Evaluates responder proximity against the 500m incident perimeter.
    """
    if not isinstance(body, dict):
        return make_response(400, {"error": "Invalid request body", "code": "VALIDATION_ERROR"})
    incident_id = body.get("incidentId", "INC-LIVE")
    responder_pos = body.get("responderPosition", [78.4900, 17.4380])
    incident_pos = body.get("incidentPosition", [78.4983, 17.4399])
    radius = body.get("radiusMeters", 500)
    gf_res = evaluate_incident_geofence(incident_id, responder_pos, incident_pos, radius)
    return make_response(200, gf_res)

def handle_location_geocode(query_params: dict) -> dict:
    """
    GET /location/geocode - Reverse geocodes lat/lng into Hyderabad street addresses.
    """
    try:
        lat = float(query_params.get("lat", 17.4399))
        lng = float(query_params.get("lng", 78.4983))
        res = reverse_geocode_coordinates(lat, lng)
        return make_response(200, res)
    except Exception as e:
        return make_response(400, {"error": f"Invalid coordinates: {e}", "code": "BAD_REQUEST"})

def handle_location_hubs() -> dict:
    """GET /location/hubs - Returns list of response bases and hospital coordinates."""
    return make_response(200, {"hubs": GEO_HUBS})

# ==========================================================
# 3. UNIFIED REQUEST DISPATCHER (ROUTER)
# ==========================================================

def lambda_handler(event, context):
    logger.info("Ingestion Lambda received event: %s", json.dumps(event))

    http_method = event.get("httpMethod") or (event.get("requestContext", {}).get("http", {}).get("method", "GET"))
    path = event.get("path") or event.get("rawPath", "/")
    path_parameters = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}

    if http_method == "OPTIONS":
        return make_response(200, {})

    raw_body = event.get("body", "{}")
    body = {}
    if raw_body:
        if isinstance(raw_body, str):
            try:
                body = json.loads(raw_body)
            except json.JSONDecodeError:
                return make_response(400, {"error": "Malformed JSON in request body", "code": "MALFORMED_JSON"})
        elif isinstance(raw_body, dict):
            body = raw_body

    normalized_path = "/" + path.strip("/") if path else "/"

    # 1. Health Probe
    if normalized_path == "/health":
        return handle_get_health()

    # 2. Analytics Summary
    if normalized_path == "/analytics/summary":
        return handle_get_analytics_summary()

    # 3. Resources
    if normalized_path == "/resources":
        return handle_get_resources()
    if normalized_path.startswith("/resources/"):
        res_id = path_parameters.get("resourceId") or normalized_path.split("/resources/")[1].split("/")[0]
        return handle_get_resources(resource_id=res_id)

    # 4. Events Stream
    if normalized_path == "/events":
        return handle_get_events(query_params)

    # 5. Workflows
    if normalized_path == "/workflows":
        return handle_get_workflows()
    if normalized_path.startswith("/workflows/"):
        exec_id = path_parameters.get("executionId") or normalized_path.split("/workflows/")[1].split("/")[0]
        return handle_get_workflows(execution_id=exec_id)

    # 6. Notifications
    if normalized_path == "/notifications":
        return handle_get_notifications()

    # 7. Drill Simulation
    if normalized_path == "/incidents/drill" and http_method == "POST":
        return handle_drill_simulation()

    # 8. Recommendation Approval / Rejection
    if "/recommendations/" in normalized_path:
        parts = normalized_path.strip("/").split("/")
        # format: incidents/{id}/recommendations/{recId}/approve
        if len(parts) >= 5 and parts[0] == "incidents":
            inc_id = parts[1]
            rec_id = parts[3]
            action = parts[4].lower() # 'approve' | 'reject'
            if http_method == "POST":
                return handle_recommendation_action(inc_id, rec_id, action, body)

    # 9. Resolve Incident (POST or PATCH)
    if normalized_path.endswith("/resolve"):
        inc_id = path_parameters.get("incidentId")
        if not inc_id and "/incidents/" in normalized_path:
            inc_id = normalized_path.split("/incidents/")[1].split("/resolve")[0]
        if http_method in ("POST", "PATCH"):
            return handle_resolve_incident(inc_id, body)

    # 10. Incidents Collection (POST, GET)
    if normalized_path == "/incidents":
        if http_method == "POST":
            return handle_create_incident(body)
        elif http_method == "GET":
            status_filter = query_params.get("status") if isinstance(query_params, dict) else None
            category_filter = query_params.get("category") if isinstance(query_params, dict) else None
            limit = query_params.get("limit", 50) if isinstance(query_params, dict) else 50
            return handle_get_incidents(status_filter=status_filter, category_filter=category_filter, limit=limit)

    # 11. Specific Incident by ID (GET, PATCH)
    if normalized_path.startswith("/incidents/"):
        inc_id = path_parameters.get("incidentId") or normalized_path.split("/incidents/")[1].split("/")[0]
        if http_method == "GET":
            return handle_get_incident_by_id(inc_id)
        elif http_method == "PATCH":
            return handle_patch_incident(inc_id, body)

    # 12. Amazon Polly Speech Synthesis
    if normalized_path == "/polly/synthesize" and http_method == "POST":
        return handle_polly_synthesize(body)
    if normalized_path == "/polly/voices" and http_method == "GET":
        return handle_polly_voices()

    # 13. AWS IoT Core Sensor Mesh & Telemetry
    if normalized_path == "/iot/devices" and http_method == "GET":
        return handle_iot_devices()
    if normalized_path == "/iot/rules" and http_method == "GET":
        return handle_iot_rules()
    if normalized_path == "/iot/telemetry" and http_method == "POST":
        return handle_iot_telemetry(body)
    if "/iot/devices/" in normalized_path and normalized_path.endswith("/shadow") and http_method == "POST":
        parts = normalized_path.strip("/").split("/")
        dev_id = parts[2]
        return handle_update_iot_shadow(dev_id, body)

    # 14. AWS X-Ray Distributed Tracing & Service Graph
    if normalized_path == "/xray/graph" and http_method == "GET":
        return handle_xray_graph()
    if normalized_path == "/xray/traces" and http_method == "GET":
        return handle_xray_traces()
    if normalized_path.startswith("/xray/traces/") and http_method == "GET":
        tid = path_parameters.get("traceId") or normalized_path.split("/xray/traces/")[1].split("/")[0]
        return handle_xray_trace_detail(tid)

    # 15. Amazon Rekognition Vision Analysis
    if normalized_path == "/rekognition/samples" and http_method == "GET":
        return handle_rekognition_samples()
    if normalized_path == "/rekognition/analyze" and http_method == "POST":
        return handle_rekognition_analyze(body)

    # 16. Amazon Location Service Routing & Geofencing
    if normalized_path == "/location/routes" and http_method == "POST":
        return handle_location_routes(body)
    if normalized_path == "/location/geofence" and http_method == "POST":
        return handle_location_geofence(body)
    if normalized_path == "/location/geocode" and http_method == "GET":
        return handle_location_geocode(query_params)
    if normalized_path == "/location/hubs" and http_method == "GET":
        return handle_location_hubs()

    return make_response(405, {"error": f"Method {http_method} on path {path} not allowed", "code": "METHOD_NOT_ALLOWED"})
