import json
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
import sys
import os

# Ensure local directories are on python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from backend.common.validation import validate_incident_payload
    from backend.classifier.app import classify_incident
    from backend.resource.app import allocate_resources
    from backend.notification.app import format_alert_message
except ImportError:
    from common.validation import validate_incident_payload  # type: ignore
    from classifier.app import classify_incident  # type: ignore
    from resource.app import allocate_resources  # type: ignore
    from notification.app import format_alert_message  # type: ignore

# Local simulated DynamoDB Table
LOCAL_INCIDENTS_STORE = {}

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT",
    "Content-Type": "application/json"
}

def log_event(service: str, operation: str, details: dict):
    print(json.dumps({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": service,
        "operation": operation,
        **details
    }, indent=2))

class ResQFlowDevServer(BaseHTTPRequestHandler):
    def _send_response(self, status_code: int, data: dict):
        self.send_response(status_code)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        if self.path == "/incidents" or self.path == "/incidents/":
            items = list(LOCAL_INCIDENTS_STORE.values())
            items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            self._send_response(200, {"incidents": items})
        elif self.path.startswith("/incidents/"):
            inc_id = self.path.split("/incidents/")[1].split("?")[0]
            item = LOCAL_INCIDENTS_STORE.get(inc_id)
            if item:
                self._send_response(200, item)
            else:
                self._send_response(404, {"error": f"Incident {inc_id} not found"})
        else:
            self._send_response(404, {"error": "Not found"})

    def do_POST(self):
        if self.path.startswith("/incidents"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return

            # STEP 1: Ingestion Lambda Validation
            is_valid, err_msg, cleaned = validate_incident_payload(payload)
            if not is_valid:
                self._send_response(400, {"error": err_msg, "code": "VALIDATION_ERROR"})
                return

            now_iso = datetime.now(timezone.utc).isoformat()
            incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
            correlation_id = incident_id

            # Initial DynamoDB item
            record = {
                "incidentId": incident_id,
                "type": cleaned["type"],
                "description": cleaned["description"],
                "severity": "UNKNOWN",
                "status": "REPORTED",
                "peopleAffected": cleaned["peopleAffected"],
                "latitude": cleaned["location"]["latitude"],
                "longitude": cleaned["location"]["longitude"],
                "reportedBy": cleaned["reportedBy"],
                "assignedTeam": "Pending Classification...",
                "hospital": "NONE",
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "version": 1,
                "lastEventId": f"{incident_id}:IncidentReported:1"
            }
            LOCAL_INCIDENTS_STORE[incident_id] = record

            log_event("Amazon DynamoDB", "PutItem", {
                "incidentId": incident_id,
                "status": "REPORTED",
                "table": "ResQFlowIncidents"
            })

            log_event("Amazon EventBridge", "PutEvents:IncidentReported", {
                "bus": "resqflow-event-bus",
                "detailType": "IncidentReported",
                "incidentId": incident_id
            })

            # STEP 2: Classifier Lambda EventBridge consumer
            classification = classify_incident(
                cleaned["type"],
                cleaned["peopleAffected"],
                cleaned["description"]
            )
            record["severity"] = classification["severity"]
            record["category"] = classification["category"]
            record["summary"] = classification["summary"]
            record["status"] = "CLASSIFIED"
            record["updatedAt"] = datetime.now(timezone.utc).isoformat()

            log_event("Classifier Lambda", "ClassifyIncident", {
                "incidentId": incident_id,
                "severity": record["severity"],
                "category": record["category"]
            })

            log_event("Amazon EventBridge", "PutEvents:IncidentClassified", {
                "bus": "resqflow-event-bus",
                "detailType": "IncidentClassified",
                "incidentId": incident_id,
                "severity": record["severity"]
            })

            # STEP 3: Step Functions State Machine (ResQFlowIncidentWorkflow)
            TEAM_MAP = {
                "CRITICAL": {
                    "team": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
                    "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
                    "eta": 8
                },
                "HIGH": {
                    "team": "PRT-Hyderabad-Bravo (Priority Tactical Unit)",
                    "hospital": "KIMS Regional Trauma Center, Hyderabad",
                    "eta": 15
                },
                "MEDIUM": {
                    "team": "SRT-Hyderabad-Charlie (Standard First Responder)",
                    "hospital": "City Municipal Hospital & Health Care",
                    "eta": 25
                }
            }
            team_info = TEAM_MAP.get(record["severity"], TEAM_MAP["MEDIUM"])
            record["assignedTeam"] = team_info["team"]
            record["hospital"] = team_info["hospital"]
            record["etaMinutes"] = team_info["eta"]
            record["status"] = "DISPATCHED"
            record["updatedAt"] = datetime.now(timezone.utc).isoformat()

            log_event("Step Functions", "ExecuteState:AllocateResources", {
                "stateMachine": "ResQFlowIncidentWorkflow",
                "incidentId": incident_id,
                "assignedTeam": record["assignedTeam"],
                "hospital": record["hospital"]
            })

            # STEP 4: Notification Lambda & Amazon SNS
            alert_msg = format_alert_message(
                incident_id=incident_id,
                severity=record["severity"],
                category=record["category"],
                team=record["assignedTeam"],
                hospital=record["hospital"],
                eta=record["etaMinutes"],
                people_affected=record["peopleAffected"],
                location=cleaned["location"]
            )

            log_event("Amazon SNS", "PublishAlert", {
                "topic": "ResQFlowAlerts",
                "subject": f"[{record['severity']}] ResQFlow Emergency Alert: {incident_id}",
                "message": alert_msg
            })

            self._send_response(201, {
                "message": "Incident processed and dispatched across ResQFlow serverless pipeline",
                "incidentId": incident_id,
                "severity": record["severity"],
                "status": record["status"],
                "assignedTeam": record["assignedTeam"],
                "hospital": record["hospital"],
                "correlationId": correlation_id
            })
        else:
            self._send_response(404, {"error": "Not found"})

if __name__ == "__main__":
    port = 3001
    server = HTTPServer(("0.0.0.0", port), ResQFlowDevServer)
    print(f"ResQFlow Local Serverless Simulator running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
