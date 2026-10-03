import json
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from common.validation import validate_incident_payload
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
from classifier.app import classify_incident
from resource.app import allocate_resources
from notification.app import format_alert_message

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
        elif self.path == "/polly/voices":
            self._send_response(200, {
                "voices": [
                    {"id": "Kajal", "name": "Kajal", "language": "en-IN (Indian English)", "engine": "neural", "gender": "Female", "description": "Crisp Neural Dispatch Supervisor"},
                    {"id": "Aditi", "name": "Aditi", "language": "en-IN (Indian English)", "engine": "standard", "gender": "Female", "description": "Standard Municipal Broadcaster"},
                    {"id": "Matthew", "name": "Matthew", "language": "en-US (US English)", "engine": "neural", "gender": "Male", "description": "Authoritative Tactical Field Lead"},
                    {"id": "Raveena", "name": "Raveena", "language": "en-IN (Indian English)", "engine": "standard", "gender": "Female", "description": "Operations Coordinator"}
                ]
            })
        elif self.path == "/iot/devices":
            self._send_response(200, {"devices": get_all_iot_devices()})
        elif self.path == "/iot/rules":
            self._send_response(200, get_iot_rules())
        elif self.path == "/xray/graph":
            self._send_response(200, get_service_graph())
        elif self.path == "/xray/traces":
            self._send_response(200, get_trace_summaries())
        elif self.path.startswith("/xray/traces/"):
            tid = self.path.split("/xray/traces/")[1].split("?")[0]
            self._send_response(200, get_trace_detail(tid))
        elif self.path == "/rekognition/samples":
            self._send_response(200, {"samples": get_curated_samples()})
        elif self.path.startswith("/location/geocode"):
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            try:
                lat = float(qs.get("lat", [17.4399])[0])
                lng = float(qs.get("lng", [78.4983])[0])
                self._send_response(200, reverse_geocode_coordinates(lat, lng))
            except Exception as e:
                self._send_response(400, {"error": f"Invalid coordinates: {e}"})
        elif self.path == "/location/hubs":
            self._send_response(200, {"hubs": GEO_HUBS})
        else:
            self._send_response(404, {"error": "Not found"})

    def do_POST(self):
        if self.path == "/rekognition/analyze" or self.path.startswith("/rekognition/analyze"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return
            image_base64 = payload.get("imageBase64")
            reported_type = payload.get("reportedType", "FIRE")
            result = analyze_incident_image(image_base64=image_base64, reported_type=reported_type)
            log_event("Amazon Rekognition", "DetectLabels", {
                "reportedType": reported_type,
                "detectedCategory": result.get("detectedCategory"),
                "visualSeverity": result.get("visualSeverity"),
                "isLiveAWS": result.get("isLiveAWS")
            })
            self._send_response(200, result)

        elif self.path == "/location/routes" or self.path.startswith("/location/routes"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return
            departure = payload.get("departure", [78.4080, 17.4123])
            destination = payload.get("destination", [78.4983, 17.4399])
            travel_mode = payload.get("travelMode", "Truck")
            route_res = calculate_emergency_route(departure, destination, travel_mode)
            log_event("Amazon Location Service", "CalculateRoute", {
                "departure": departure,
                "destination": destination,
                "roadDistanceKm": route_res.get("roadDistanceKm"),
                "durationMinutes": route_res.get("durationMinutes")
            })
            self._send_response(200, route_res)

        elif self.path == "/location/geofence" or self.path.startswith("/location/geofence"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return
            incident_id = payload.get("incidentId", "INC-LIVE")
            responder_pos = payload.get("responderPosition", [78.4900, 17.4380])
            incident_pos = payload.get("incidentPosition", [78.4983, 17.4399])
            radius = payload.get("radiusMeters", 500)
            gf_res = evaluate_incident_geofence(incident_id, responder_pos, incident_pos, radius)
            log_event("Amazon Location Service", "EvaluateGeofence", {
                "incidentId": incident_id,
                "status": gf_res.get("status"),
                "distanceMeters": gf_res.get("currentDistanceMeters")
            })
            self._send_response(200, gf_res)

        elif self.path == "/polly/synthesize" or self.path.startswith("/polly/synthesize"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return

            text = payload.get("text", "Attention all units: ResQFlow Priority Dispatch Notification.")
            voice_id = payload.get("voiceId", "Kajal")
            engine = "neural" if voice_id in ["Kajal", "Matthew"] else "standard"

            try:
                import boto3
                import base64
                polly = boto3.client("polly", region_name="ap-south-1")
                res = polly.synthesize_speech(
                    Text=text[:1000],
                    OutputFormat="mp3",
                    VoiceId=voice_id,
                    Engine=engine
                )
                stream = res.get("AudioStream")
                if stream:
                    audio_b64 = base64.b64encode(stream.read()).decode("utf-8")
                    log_event("Amazon Polly", "SynthesizeSpeech", {
                        "voiceId": voice_id,
                        "engine": engine,
                        "characters": len(text),
                        "outputFormat": "mp3"
                    })
                    self._send_response(200, {
                        "audioBase64": audio_b64,
                        "contentType": "audio/mpeg",
                        "voiceId": voice_id,
                        "engine": engine,
                        "characters": len(text),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    return
                else:
                    self._send_response(500, {"error": "No audio stream returned from Amazon Polly"})
                    return
            except Exception as e:
                print(f"[Polly Error] {e}")
                self._send_response(500, {"error": f"Polly synthesis failed: {str(e)}"})
                return

        elif self.path == "/iot/telemetry" or self.path.startswith("/iot/telemetry"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return

            result = publish_mqtt_telemetry(payload)

            # If threshold exceeded or emergency flag set, automatically inject into ResQFlow incident lifecycle!
            if result.get("isEmergency") and result.get("incidentPayload"):
                inc_data = result["incidentPayload"]
                now_iso = datetime.now(timezone.utc).isoformat()
                incident_id = f"INC-IOT-{uuid.uuid4().hex[:4].upper()}"

                clf_res = classify_incident({
                    "incidentId": incident_id,
                    "type": inc_data["type"],
                    "description": inc_data["description"],
                    "peopleAffected": inc_data["peopleAffected"],
                    "location": inc_data["location"]
                })
                severity = clf_res.get("severity", "CRITICAL")

                alloc_res = allocate_resources({
                    "incidentId": incident_id,
                    "type": inc_data["type"],
                    "severity": severity,
                    "location": inc_data["location"],
                    "peopleAffected": inc_data["peopleAffected"]
                })

                record = {
                    "incidentId": incident_id,
                    "type": inc_data["type"],
                    "description": inc_data["description"],
                    "severity": severity,
                    "status": "DISPATCHED",
                    "peopleAffected": inc_data["peopleAffected"],
                    "latitude": inc_data["location"]["latitude"],
                    "longitude": inc_data["location"]["longitude"],
                    "reportedBy": inc_data["reportedBy"],
                    "assignedTeam": alloc_res.get("assignedTeam", "ERT-Hyderabad-Alpha"),
                    "hospital": alloc_res.get("hospital", "Apollo Health City Jubilee Hills"),
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                    "version": 1,
                    "source": "AWS_IOT_CORE",
                    "iotTelemetry": inc_data["sensorTelemetry"]
                }
                LOCAL_INCIDENTS_STORE[incident_id] = record
                result["incidentId"] = incident_id
                result["incident"] = record

            self._send_response(200, result)

        elif "/iot/devices/" in self.path and "/shadow" in self.path:
            parts = self.path.strip("/").split("/")
            device_id = parts[2]
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self._send_response(400, {"error": "Malformed JSON", "details": str(e)})
                return
            try:
                shadow = update_device_shadow(device_id, payload.get("desired", payload))
                self._send_response(200, {"deviceId": device_id, "shadow": shadow})
            except Exception as err:
                self._send_response(404, {"error": str(err)})

        elif self.path.startswith("/incidents"):
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
