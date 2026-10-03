# ResQFlow — Amazon EventBridge Event Contracts Specification

> **Event Bus Name:** `resqflow-event-bus`  
> **Target Region:** `ap-south-2` (Hyderabad)  
> **Retention / Archive:** `ResQFlow-EventArchive` (14 days replayable retention)  
> **Schema Standard:** CloudEvents / AWS EventBridge Standard Envelope

---

## 1. Event Envelope Standard

All events routed through `resqflow-event-bus` adhere to the canonical EventBridge JSON envelope structure:

```json
{
  "version": "0",
  "id": "e4b98124-7123-4567-89ab-cdef01234567",
  "detail-type": "<ContractName>",
  "source": "<DomainSource>",
  "account": "123456789012",
  "time": "2026-10-01T08:30:00Z",
  "region": "ap-south-2",
  "resources": [],
  "detail": {
    "schemaVersion": "1.0",
    "correlationId": "INC-7F89B2",
    "isSimulation": true
  }
}
```

---

## 2. Event Catalog & Payload Specifications

### 2.1 `IncidentReported`
- **Source:** `resqflow.incident`
- **Detail-Type:** `IncidentReported`
- **Trigger:** Published immediately after atomic persistence in DynamoDB.
- **Consumer:** EventBridge Rule `ResQFlow-RouteReported` ➔ Step Functions State Machine `ResQFlowIncidentWorkflow`.

```json
{
  "detail-type": "IncidentReported",
  "source": "resqflow.incident",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "type": "FIRE",
    "description": "Multi-floor structure fire with heavy smoke entrapment",
    "peopleAffected": 15,
    "location": {
      "latitude": 17.4399,
      "longitude": 78.4983
    },
    "reportedBy": "OPERATOR-SECUNDERABAD-01",
    "isSimulation": true,
    "timestamp": "2026-10-01T08:30:00Z"
  }
}
```

---

### 2.2 `IncidentClassified`
- **Source:** `resqflow.classifier`
- **Detail-Type:** `IncidentClassified`
- **Trigger:** Emitted by Classifier Lambda after executing deterministic triage heuristics or foundation model scoring.

```json
{
  "detail-type": "IncidentClassified",
  "source": "resqflow.classifier",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "severity": "CRITICAL",
    "category": "FIRE",
    "classificationReason": "Mass Casualty Heuristic triggered (≥10 casualties reported: 15)",
    "triageEngine": "Deterministic Rule Engine v2.1",
    "isSimulation": true,
    "timestamp": "2026-10-01T08:30:01Z"
  }
}
```

---

### 2.3 `ResourceRecommendationCreated`
- **Source:** `resqflow.resource`
- **Detail-Type:** `ResourceRecommendationCreated`
- **Trigger:** Emitted by Resource Allocation Lambda after ranking tactical units and trauma facilities by Haversine proximity.

```json
{
  "detail-type": "ResourceRecommendationCreated",
  "source": "resqflow.resource",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "recommendationId": "REC-7F89B2-1",
    "assignedTeam": "ERT-Hyderabad-Alpha (Special Rapid Deployment)",
    "hospital": "Apollo Emergency & Trauma Care, Hyderabad",
    "etaMinutes": 8,
    "distanceKm": 4.2,
    "isSimulation": true,
    "timestamp": "2026-10-01T08:30:02Z"
  }
}
```

---

### 2.4 `ResourceRecommendationApproved`
- **Source:** `resqflow.dispatch`
- **Detail-Type:** `ResourceRecommendationApproved`
- **Trigger:** Emitted when a human dispatch operator reviews and approves a simulated dispatch allocation.

```json
{
  "detail-type": "ResourceRecommendationApproved",
  "source": "resqflow.dispatch",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "recommendationId": "REC-7F89B2-1",
    "operatorId": "DISP-HYD-01",
    "approvedAt": "2026-10-01T08:31:00Z",
    "decisionNotes": "Immediate priority dispatch authorized for Level 1 Trauma Center ingress."
  }
}
```

---

### 2.5 `ResourceRecommendationRejected`
- **Source:** `resqflow.dispatch`
- **Detail-Type:** `ResourceRecommendationRejected`
- **Trigger:** Emitted when an operator rejects a recommended unit, requesting re-evaluation or manual resource assignment.

```json
{
  "detail-type": "ResourceRecommendationRejected",
  "source": "resqflow.dispatch",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "recommendationId": "REC-7F89B2-1",
    "operatorId": "DISP-HYD-01",
    "rejectionReason": "Unit Alpha already pre-committed to VIP convoy escort."
  }
}
```

---

### 2.6 `IncidentDispatchSimulated`
- **Source:** `resqflow.dispatch`
- **Detail-Type:** `IncidentDispatchSimulated`
- **Trigger:** Emitted when the dispatch is recorded and published to Amazon SNS topic `ResQFlowAlerts`.

```json
{
  "detail-type": "IncidentDispatchSimulated",
  "source": "resqflow.dispatch",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "assignedTeam": "ERT-Hyderabad-Alpha",
    "hospital": "Apollo Emergency & Trauma Care",
    "snsTopicArn": "arn:aws:sns:ap-south-2:123456789012:ResQFlowAlerts",
    "isSimulation": true
  }
}
```

---

### 2.7 `IncidentResolved`
- **Source:** `resqflow.incident`
- **Detail-Type:** `IncidentResolved`
- **Trigger:** Emitted when an incident is stabilized and marked as RESOLVED by the command center.

```json
{
  "detail-type": "IncidentResolved",
  "source": "resqflow.incident",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "resolvedAt": "2026-10-01T08:45:00Z",
    "operatorNotes": "Threat fully contained; casualties safely admitted to Apollo ICU."
  }
}
```

---

### 2.8 `IncidentProcessingFailed`
- **Source:** `resqflow.orchestration`
- **Detail-Type:** `IncidentProcessingFailed`
- **Trigger:** Emitted if Step Functions catches an unrecoverable Lambda failure or if a message drops to the Dead-Letter Queue (`ResQFlow-DeadLetterQueue`).

```json
{
  "detail-type": "IncidentProcessingFailed",
  "source": "resqflow.orchestration",
  "detail": {
    "schemaVersion": "1.0",
    "incidentId": "INC-7F89B2",
    "correlationId": "INC-7F89B2",
    "failedState": "AllocateResources",
    "errorType": "States.TaskFailed",
    "errorMessage": "Resource allocation service timed out after 3 retries",
    "dlqQueueArn": "arn:aws:sqs:ap-south-2:123456789012:ResQFlow-DeadLetterQueue"
  }
}
```
