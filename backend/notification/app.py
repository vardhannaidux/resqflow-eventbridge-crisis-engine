import json
import os
import logging
from datetime import datetime, timezone
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
sns_client = boto3.client("sns")

def format_alert_message(incident_id: str, severity: str, category: str, team: str, hospital: str, eta: int, people_affected: int, location: dict):
    lines = [
        "==================================================",
        f"🚨 RESQFLOW EMERGENCY DISPATCH ALERT: {severity} 🚨",
        "==================================================",
        f"Incident ID     : {incident_id}",
        f"Category        : {category}",
        f"Severity Level  : {severity}",
        f"People Affected : {people_affected}",
        f"Assigned Unit   : {team}",
        f"Receiving Trauma: {hospital}",
        f"Unit ETA        : {eta} minute(s)",
        f"Coordinates     : Lat {location.get('latitude', 'N/A')}, Lon {location.get('longitude', 'N/A')}",
        f"Timestamp (UTC) : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "==================================================",
        "All local first responder teams take immediate notice."
    ]
    return "\n".join(lines)

def lambda_handler(event, context):
    logger.info("Notification received event: %s", json.dumps(event))

    detail = event.get("detail") or event
    incident_id = detail.get("incidentId", "UNKNOWN")
    severity = detail.get("severity", "MEDIUM")
    category = detail.get("category", "EMERGENCY")
    team = detail.get("assignedTeam", "First Responder Unit")
    hospital = detail.get("hospital", "Regional Medical Center")
    eta = detail.get("etaMinutes", 15)
    people_affected = detail.get("peopleAffected", 0)
    location = detail.get("location", {})

    message_body = format_alert_message(
        incident_id=incident_id,
        severity=severity,
        category=category,
        team=team,
        hospital=hospital,
        eta=eta,
        people_affected=people_affected,
        location=location
    )

    subject = f"[{severity}] ResQFlow Emergency Alert: {incident_id} ({category})"

    if not SNS_TOPIC_ARN:
        logger.warning("SNS_TOPIC_ARN not configured. Simulating alert broadcast.")
        return {
            "statusCode": 200,
            "status": "SIMULATED",
            "message": message_body
        }

    try:
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],  # SNS subject max 100 chars
            Message=message_body
        )
        logger.info("Successfully published SNS alert for %s: %s", incident_id, response.get("MessageId"))
        return {
            "statusCode": 200,
            "status": "PUBLISHED",
            "messageId": response.get("MessageId")
        }
    except Exception as e:
        logger.error("Failed to publish SNS alert for %s: %s", incident_id, str(e))
        raise
