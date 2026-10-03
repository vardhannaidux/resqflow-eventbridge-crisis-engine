# ResQFlow — REST API Documentation

> **Base URL (AWS Live ap-south-2):** `https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com`  
> **Base URL (Local Simulator):** `http://localhost:3001`  
> **Protocol:** HTTPS / HTTP 1.1  
> **Data Format:** JSON (`application/json`)  
> **Target Region:** `ap-south-2` (Hyderabad)

---

## 1. Authentication & Headers

Requests accept standard JSON headers. Privileged operator actions (such as recommendation approval/rejection or resolution) pass operator identification via headers or JWT context:

```http
Content-Type: application/json
Accept: application/json
X-Operator-Id: DISP-HYD-01
Authorization: Bearer <token> (Optional in demo mode)
```

---

## 2. Core API Endpoints

### 2.1 Ingest Emergency Incident
- **Method:** `POST`
- **Path:** `/incidents`
- **Description:** Validates and persists an emergency incident record into Amazon DynamoDB and publishes an `IncidentReported` event into `resqflow-event-bus`.

#### Request Body
```json
{
  "type": "FIRE",
  "description": "Multi-floor structure fire with heavy smoke entrapment on levels 3-5",
  "peopleAffected": 15,
  "location": {
    "latitude": 17.4399,
    "longitude": 78.4983
  },
  "reportedBy": "OPERATOR-SECUNDERABAD-01"
}
```

#### Field Validation Rules
| Field | Type | Required | Constraints |
|---|---|---|---|
| `type` | String | Yes | One of: `FIRE`, `MEDICAL`, `ACCIDENT`, `FLOOD`, `EARTHQUAKE`, `OTHER` |
| `description` | String | Yes | 1 to 1000 characters, non-empty |
| `peopleAffected`| Integer| Yes | ≥ 0, integer value |
| `location` | Object | Yes | Must contain valid `latitude` (-90 to 90) and `longitude` (-180 to 180) |
| `reportedBy` | String | No | Defaults to `ANONYMOUS` |

#### Success Response (`201 Created`)
```json
{
  "message": "Incident successfully reported and queued for classification",
  "incidentId": "INC-7F89B2",
  "status": "REPORTED",
  "severity": "UNKNOWN",
  "correlationId": "INC-7F89B2",
  "createdAt": "2026-10-01T08:30:00.000Z"
}
```

---

### 2.2 List Incidents
- **Method:** `GET`
- **Path:** `/incidents`
- **Query Parameters:**
  - `status` (Optional): Filter by `REPORTED`, `CLASSIFIED`, `DISPATCHED`, `RESOLVED`.
  - `category` (Optional): Filter by incident type / category.
  - `limit` (Optional): Bounded pagination limit (default: 50, max: 100).

#### Success Response (`200 OK`)
```json
{
  "incidents": [
    {
      "incidentId": "INC-7F89B2",
      "type": "FIRE",
      "description": "Multi-floor structure fire with heavy smoke entrapment",
      "severity": "CRITICAL",
      "status": "DISPATCHED",
      "peopleAffected": 15,
      "latitude": 17.4399,
      "longitude": 78.4983,
      "assignedTeam": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
      "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
      "etaMinutes": 8,
      "createdAt": "2026-10-01T08:30:00.000Z",
      "updatedAt": "2026-10-01T08:30:02.140Z",
      "version": 2
    }
  ],
  "count": 1,
  "totalScanned": 12
}
```

---

### 2.3 Get Incident Details
- **Method:** `GET`
- **Path:** `/incidents/{incidentId}`

#### Success Response (`200 OK`)
```json
{
  "incidentId": "INC-7F89B2",
  "type": "FIRE",
  "description": "Multi-floor structure fire with heavy smoke entrapment",
  "severity": "CRITICAL",
  "category": "FIRE",
  "status": "DISPATCHED",
  "peopleAffected": 15,
  "location": {
    "latitude": 17.4399,
    "longitude": 78.4983
  },
  "assignedTeam": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
  "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
  "etaMinutes": 8,
  "createdAt": "2026-10-01T08:30:00.000Z",
  "updatedAt": "2026-10-01T08:30:02.140Z",
  "version": 2
}
```

---

### 2.4 Patch Incident Fields
- **Method:** `PATCH`
- **Path:** `/incidents/{incidentId}`
- **Description:** Updates permitted operational fields (`description`, `peopleAffected`, `assignedTeam`, `hospital`, `status`, `notes`) with optimistic locking (`version` check). Rejects modifications if the incident is already `RESOLVED`.

#### Request Body
```json
{
  "description": "Structure fire contained to 4th floor; evacuation underway",
  "peopleAffected": 12,
  "assignedTeam": "ERT-Hyderabad-Alpha",
  "hospital": "Apollo Emergency & Trauma Care"
}
```

#### Success Response (`200 OK`)
```json
{
  "message": "Incident INC-7F89B2 updated successfully",
  "incident": {
    "incidentId": "INC-7F89B2",
    "version": 3,
    "updatedAt": "2026-10-01T08:35:00.000Z"
  }
}
```

#### Error Response (`409 Conflict`)
```json
{
  "error": "Conflict: incident was modified concurrently by another process. Please reload and retry.",
  "code": "CONCURRENCY_CONFLICT"
}
```

---

### 2.5 Resolve Incident
- **Method:** `POST` or `PATCH`
- **Path:** `/incidents/{incidentId}/resolve`
- **Description:** Transitions incident to `RESOLVED`, sets `resolvedAt`, publishes `IncidentResolved` to EventBridge. Idempotent on already resolved incidents.

#### Request Body
```json
{
  "notes": "Fire extinguished by Unit Alpha. Casualties stabilized and transferred to Apollo Trauma Center."
}
```

#### Success Response (`200 OK`)
```json
{
  "message": "Incident INC-7F89B2 marked as RESOLVED",
  "incidentId": "INC-7F89B2",
  "status": "RESOLVED",
  "resolvedAt": "2026-10-01T08:45:12.300Z"
}
```

---

### 2.6 Recommendation Approval / Rejection
- **Method:** `POST`
- **Path:** `/incidents/{incidentId}/recommendations/{recId}/approve`
- **Path:** `/incidents/{incidentId}/recommendations/{recId}/reject`
- **Description:** Records human authorization for tactical dispatch simulation.

#### Approve Request Body
```json
{
  "operatorId": "DISP-HYD-01"
}
```

#### Approve Success Response (`200 OK`)
```json
{
  "message": "Recommendation REC-1 approved for INC-7F89B2. Simulated dispatch recorded.",
  "incidentId": "INC-7F89B2",
  "status": "DISPATCHED",
  "decision": "APPROVED"
}
```

#### Reject Request Body
```json
{
  "operatorId": "DISP-HYD-01",
  "reason": "Traffic congestion on arterial flyover; alternate unit requested"
}
```

#### Reject Success Response (`200 OK`)
```json
{
  "message": "Recommendation REC-1 rejected for INC-7F89B2.",
  "incidentId": "INC-7F89B2",
  "decision": "REJECTED"
}
```

---

### 2.7 Emergency Resources & Hospital Catalog
- **Method:** `GET`
- **Path:** `/resources`
- **Path:** `/resources/{resourceId}`
- **Description:** Returns live availability of tactical response units and trauma hospital capacities.

#### Success Response (`200 OK`)
```json
{
  "resources": [
    {
      "id": "ERT-HYD-01",
      "name": "ERT-Hyderabad-Alpha",
      "type": "Special Rapid Deployment",
      "tier": "Tier-1 Emergency Response",
      "status": "DISPATCHED",
      "crewSize": 6,
      "baseLocation": "Central Fire & Rescue HQ, Hyderabad",
      "latitude": 17.4065,
      "longitude": 78.4772,
      "isSimulation": true
    }
  ],
  "hospitals": [
    {
      "id": "HOSP-APOLLO",
      "name": "Apollo Emergency & Trauma Care, Hyderabad",
      "tier": "Level 1 Trauma Center",
      "emergencyBedsAvailable": 14,
      "icuBedsAvailable": 6,
      "bloodBankStatus": "OPTIMAL",
      "helipadAvailable": true,
      "isSimulation": true
    }
  ],
  "totalUnits": 4,
  "totalHospitals": 3,
  "isSimulation": true
}
```

---

### 2.8 Audit Event Stream
- **Method:** `GET`
- **Path:** `/events`
- **Query Parameters:** `detailType` (Optional)
- **Description:** Returns chronological EventBridge audit stream reconstructed from persisted events.

---

### 2.9 Step Functions Workflow Monitor
- **Method:** `GET`
- **Path:** `/workflows`
- **Path:** `/workflows/{executionId}`
- **Description:** Queries active and completed Step Functions execution states.

---

### 2.10 Broadcast Notifications
- **Method:** `GET`
- **Path:** `/notifications`
- **Description:** Returns broadcast alerts dispatched to Amazon SNS and logged in SQS audit queue.

---

### 2.11 Analytics Summary
- **Method:** `GET`
- **Path:** `/analytics/summary`
- **Description:** Aggregates real-time KPIs and distributions calculated directly from stored DynamoDB records.

#### Success Response (`200 OK`)
```json
{
  "totalIncidents": 11,
  "activeIncidents": 3,
  "resolvedIncidents": 8,
  "criticalIncidents": 4,
  "resolutionRatePercent": 72.7,
  "totalCasualties": 48,
  "averageCasualtiesPerIncident": 4.36,
  "categoryBreakdown": { "FIRE": 5, "MEDICAL": 3, "ACCIDENT": 2, "FLOOD": 1 },
  "severityBreakdown": { "CRITICAL": 4, "HIGH": 4, "MEDIUM": 3, "LOW": 0, "UNKNOWN": 0 },
  "timestamp": "2026-10-01T08:50:00.000Z"
}
```

---

### 2.12 Disaster Simulation Drill
- **Method:** `POST`
- **Path:** `/incidents/drill`
- **Description:** Ingests 3 simultaneous multi-severity incidents across Hyderabad sectors to test high-concurrency Step Functions execution.

---

### 2.13 Health Probe
- **Method:** `GET`
- **Path:** `/health`
- **Description:** Deep health check testing connectivity to DynamoDB and EventBridge.

#### Success Response (`200 OK`)
```json
{
  "status": "healthy",
  "service": "ResQFlowServerlessGateway",
  "region": "ap-south-2",
  "dependencies": {
    "dynamodb": "ACTIVE",
    "eventbridge": "ACTIVE",
    "tableName": "ResQFlowIncidents",
    "eventBusName": "resqflow-event-bus"
  },
  "timestamp": "2026-10-01T08:50:00.000Z"
}
```

---

## 3. Standard Error Envelope

When validation or server failures occur, the API returns consistent JSON error payloads:

```json
{
  "error": "Cannot modify an incident that has already been RESOLVED",
  "code": "INVALID_PATCH"
}
```
