import json
import uuid
from datetime import datetime, timezone
import boto3
import os

EVENT_SOURCE = "resqflow.incident"
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "resqflow-event-bus")

eventbridge_client = None

def get_eventbridge_client():
    global eventbridge_client
    if eventbridge_client is None:
        eventbridge_client = boto3.client("events")
    return eventbridge_client

def build_event(detail_type: str, detail: dict, incident_id: str = None, correlation_id: str = None) -> dict:
    """
    Builds a standard ResQFlow event envelope according to architectural guidelines.
    """
    event_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    inc_id = incident_id or detail.get("incidentId", f"INC-{uuid.uuid4().hex[:8].upper()}")
    corr_id = correlation_id or detail.get("correlationId", inc_id)
    idempotency_key = detail.get("idempotencyKey", f"{inc_id}:{detail_type}:1")

    # Ensure required fields in detail
    enriched_detail = {
        **detail,
        "incidentId": inc_id,
        "correlationId": corr_id,
        "idempotencyKey": idempotency_key,
        "timestamp": now_iso
    }

    return {
        "version": "1.0",
        "id": event_id,
        "source": EVENT_SOURCE,
        "detail-type": detail_type,
        "time": now_iso,
        "detail": enriched_detail
    }

def publish_event(detail_type: str, detail: dict, bus_name: str = None) -> dict:
    """
    Publishes a single event to the EventBridge custom bus.
    """
    client = get_eventbridge_client()
    target_bus = bus_name or EVENT_BUS_NAME
    
    inc_id = detail.get("incidentId")
    corr_id = detail.get("correlationId", inc_id)
    event_envelope = build_event(detail_type, detail, incident_id=inc_id, correlation_id=corr_id)
    
    entry = {
        "Source": event_envelope["source"],
        "DetailType": event_envelope["detail-type"],
        "Detail": json.dumps(event_envelope["detail"]),
        "EventBusName": target_bus,
        "Time": datetime.now(timezone.utc)
    }
    
    response = client.put_events(Entries=[entry])
    return {
        "event": event_envelope,
        "response": response
    }
