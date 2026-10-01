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

    def _process_incident(self, payload):
        is_valid, err_msg, cleaned = validate_incident_payload(payload)
        if not is_valid:
            return None, err_msg

        now_iso = datetime.now(timezone.utc).isoformat()
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        correlation_id = incident_id

        record = {
            "incidentId": incident_id,
            "type": cleaned["type"],
            "description": cleaned["description"],
            "severity": "UNKNOWN",
            "status": "REPORTED",
            "peopleAffected": cleaned["peopleAffected"],
            "latitude": cleaned["location"]["latitude"],
            "longitude": cleaned["location"]["longitude"],
            "location": cleaned["location"],
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

        # Classification
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

        # Allocation
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
        assignment = TEAM_MAP.get(record["severity"], TEAM_MAP["MEDIUM"])
        record["assignedTeam"] = assignment["team"]
        record["hospital"] = assignment["hospital"]
        record["etaMinutes"] = assignment["eta"]
        record["status"] = "DISPATCHED"
        record["updatedAt"] = datetime.now(timezone.utc).isoformat()

        log_event("Step Functions", "AllocateResources", {
            "incidentId": incident_id,
            "assignedTeam": record["assignedTeam"],
            "hospital": record["hospital"],
            "eta": record["etaMinutes"]
        })

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

        return record, None

    def do_POST(self):
        if self.path == "/incidents/drill" or self.path == "/incidents/drill/":
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
            for s in drill_scenarios:
                rec, _ = self._process_incident(s)
                if rec:
                    created.append(rec)
            self._send_response(201, {
                "message": "Synchronized multi-incident disaster drill triggered successfully",
                "incidents": created
            })
            return

        if self.path.endswith("/resolve"):
            inc_id = self.path.split("/incidents/")[1].split("/resolve")[0]
            record = LOCAL_INCIDENTS_STORE.get(inc_id)
            if not record:
                self._send_response(404, {"error": f"Incident {inc_id} not found"})
                return
            now_iso = datetime.now(timezone.utc).isoformat()
            record["status"] = "RESOLVED"
            record["resolvedAt"] = now_iso
            record["updatedAt"] = now_iso
            log_event("Amazon EventBridge", "PutEvents:IncidentResolved", {
                "bus": "resqflow-event-bus",
                "incidentId": inc_id,
                "status": "RESOLVED"
            })
            self._send_response(200, {
                "message": f"Incident {inc_id} marked as RESOLVED",
                "incidentId": inc_id,
                "status": "RESOLVED"
            })
            return

        if self.path.startswith("/incidents"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return

            record, err_msg = self._process_incident(payload)
            if err_msg:
                self._send_response(400, {"error": err_msg, "code": "VALIDATION_ERROR"})
                return

            self._send_response(201, {
                "message": "Incident processed and dispatched across ResQFlow serverless pipeline",
                "incidentId": record["incidentId"],
                "severity": record["severity"],
                "status": record["status"],
                "assignedTeam": record["assignedTeam"],
                "hospital": record["hospital"]
            })
            return

        self._send_response(404, {"error": "Not found"})

if __name__ == "__main__":
    port = 3001
    server = HTTPServer(("0.0.0.0", port), ResQFlowDevServer)
    print(f"ResQFlow Local Serverless Simulator running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
