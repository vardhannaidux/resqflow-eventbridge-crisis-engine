# ResQFlow Hackathon Live Demonstration Script

## Demonstration Objective
Showcase an end-to-end, real-time emergency lifecycle triggered via HTTP API, routed dynamically through EventBridge, classified deterministically, orchestrated with AWS Step Functions, and observed in real-time.

---

## Live Demo Scenario: Major Commercial Fire in Hyderabad

### 1. Incident Ingestion
Trigger via `POST /incidents`:
```bash
curl -X POST "$API_ENDPOINT/incidents" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FIRE",
    "description": "Multi-alarm fire at Secunderabad commercial complex, civilians trapped",
    "peopleAffected": 15,
    "location": {
      "latitude": 17.4399,
      "longitude": 78.4983
    },
    "reportedBy": "FIELD-DISPATCHER-HYD-04"
  }'
```

### 2. Verified Execution Steps
1. **API Gateway & Ingestion Lambda**:
   - Accepts request, generates `INC-XXXXXX`
   - Stores initial record in DynamoDB (`status: REPORTED`, `severity: UNKNOWN`)
   - Emits `IncidentReported` to EventBridge bus `resqflow-event-bus`
2. **EventBridge Rule & Classifier Lambda**:
   - Catches `IncidentReported`
   - Deterministically calculates `peopleAffected: 15 >= 10` -> `CRITICAL`
   - Updates DynamoDB (`severity: CRITICAL`, `status: CLASSIFIED`)
   - Emits `IncidentClassified` to EventBridge
3. **Step Functions Execution**:
   - Triggers `ResQFlowIncidentWorkflow`
   - Choice router detects `severity: CRITICAL`
   - Invokes `ResourceAllocationFunction`
     - Assigns `ERT-Hyderabad-Alpha (Special Rapid Deployment)`
     - Assigns `Apollo Emergency & Trauma Care, Hyderabad` (ETA: 8 mins)
     - Updates DynamoDB to `status: DISPATCHED`
     - Emits `ResourceAllocated` and `TeamDispatched`
   - Invokes `NotificationFunction`
     - Formats broadcast alert
     - Dispatches to Amazon SNS `ResQFlowAlerts`
4. **Command Center Dashboard**:
   - Visual KPI updates: Critical +1, Active +1
   - Incident appears at the top of the live table
   - Complete audit timeline shows timestamps for each lifecycle transition
