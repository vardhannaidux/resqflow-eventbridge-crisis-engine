# ResQFlow Domain Event Catalog

All events within the ResQFlow ecosystem are routed through the custom event bus:
**`resqflow-event-bus`**

## 1. IncidentReported
- **Source**: `resqflow.incident`
- **Detail-Type**: `IncidentReported`
- **Triggered By**: Ingestion Lambda when a new incident report is accepted.
- **Payload Schema**:
```json
{
  "version": "1.0",
  "id": "uuid",
  "source": "resqflow.incident",
  "detail-type": "IncidentReported",
  "time": "ISO8601-UTC",
  "detail": {
    "incidentId": "INC-1001",
    "type": "FIRE",
    "description": "Fire reported near a school",
    "severity": "UNKNOWN",
    "peopleAffected": 12,
    "location": {
      "latitude": 16.5062,
      "longitude": 80.6480
    },
    "reportedBy": "USER-001",
    "correlationId": "INC-1001",
    "idempotencyKey": "INC-1001:IncidentReported:1"
  }
}
```

---

## 2. IncidentClassified
- **Source**: `resqflow.incident`
- **Detail-Type**: `IncidentClassified`
- **Triggered By**: Classifier Lambda after deterministic evaluation.
- **Payload Schema**:
```json
{
  "version": "1.0",
  "id": "uuid",
  "source": "resqflow.incident",
  "detail-type": "IncidentClassified",
  "time": "ISO8601-UTC",
  "detail": {
    "incidentId": "INC-1001",
    "category": "FIRE",
    "severity": "CRITICAL",
    "summary": "High-impact critical fire incident affecting 12 person(s). Requires immediate CRITICAL dispatch protocol.",
    "recommendedResources": ["FIRE_RESPONSE_TEAM_ALPHA", "RAPID_WATER_TENDER", "PARAMEDIC_UNIT"],
    "peopleAffected": 12,
    "location": { "latitude": 16.5062, "longitude": 80.6480 },
    "reportedBy": "USER-001",
    "correlationId": "INC-1001",
    "idempotencyKey": "INC-1001:IncidentClassified:1"
  }
}
```

---

## 3. ResourceAllocated
- **Source**: `resqflow.incident`
- **Detail-Type**: `ResourceAllocated`
- **Triggered By**: Resource Allocation Lambda within Step Functions execution.
- **Payload Schema**:
```json
{
  "version": "1.0",
  "id": "uuid",
  "source": "resqflow.incident",
  "detail-type": "ResourceAllocated",
  "time": "ISO8601-UTC",
  "detail": {
    "incidentId": "INC-1001",
    "severity": "CRITICAL",
    "category": "FIRE",
    "assignedTeam": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
    "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
    "etaMinutes": 8,
    "correlationId": "INC-1001",
    "idempotencyKey": "INC-1001:ResourceAllocated:1"
  }
}
```

---

## 4. TeamDispatched
- **Source**: `resqflow.incident`
- **Detail-Type**: `TeamDispatched`
- **Triggered By**: Resource Allocation Lambda to mark active field mobilization.

---

## 5. IncidentResolved
- **Source**: `resqflow.incident`
- **Detail-Type**: `IncidentResolved`
- **Triggered By**: Operational responder closing the incident.
