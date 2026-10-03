# ResQFlow — Five-Minute Hackathon Demonstration Script

> **Target Audience:** Hackathon Judges, University Evaluators, AWS Serverless Architects  
> **Total Duration:** 5 Minutes  
> **Key Objective:** Showcase a real, traceable, end-to-end emergency response pipeline running on AWS serverless infrastructure with an enterprise ATLAS Light UI.

---

## ⏱️ Minute-by-Minute Demonstration Flow

### Minute 0:00 – 0:45 | Scene 1: Operations Command Center & Architecture
- **Action:** Open `http://localhost:3000/dashboard` in the browser.
- **Talking Points:**
  - *"Welcome to ResQFlow. This is our intelligent event-driven emergency response orchestration platform, built natively on AWS Serverless in the `ap-south-2` Hyderabad region."*
  - *"Notice the ATLAS Light design system: high information density, clean typography, and zero distracting gimmicks."*
  - *"Point out the Header: Live AWS Cloud connection pill showing real-time latency (45ms), active region badge, and the persistent Simulation Warning banner ensuring ethical compliance."*

---

### Minute 0:45 – 1:30 | Scene 2: Incident Ingestion & Atomic Persistence
- **Action:** Click the blue **"+ Report Emergency"** button in the header.
- **Action:** In the modal, select Category **FIRE**, enter Description *"Commercial structure fire with smoke entrapment on upper floors"*, set People Affected to `15`, pick Sector *"Secunderabad Commercial Complex"*, and click **"Ingest Emergency"**.
- **Talking Points:**
  - *"When we click submit, API Gateway receives the payload, enforces rate throttling, and invokes our Ingestion Lambda."*
  - *"The record is atomically written to Amazon DynamoDB with optimistic concurrency control, returning HTTP 201 in under 90ms."*
  - *"Notice the tactical audio cue and toast notification alerting the operator of real-time ingestion."*

---

### Minute 1:30 – 2:30 | Scene 3: Explainable Triage & Lifecycle Inspection
- **Action:** Navigate to **Incidents Directory** (`/incidents`), find the newly created incident, and click **"View Dossier"** (or click row to open `/incidents/INC-...`).
- **Talking Points:**
  - *"Here is the complete Incident Dossier. Observe the 5-stage lifecycle stepper: Reported ➔ Classified ➔ Recommended ➔ Dispatched ➔ Resolved."*
  - *"Highlight the Explainable Triage Panel: Rather than relying on an opaque black-box AI model, our deterministic rule engine evaluated 15 casualties against our mass-casualty heuristic (≥10 casualties), automatically escalating this event to CRITICAL priority in <85ms."*
  - *"Point out the Traceable Cloud Telemetry: correlation ID, DynamoDB partition key, and Step Functions execution ARN."*

---

### Minute 2:30 – 3:30 | Scene 4: Human-in-the-Loop Resource Dispatch
- **Action:** In the right column, review the **Resource Recommendation**:
  - Unit: `ERT-Hyderabad-Alpha (Special Rapid Deployment)`
  - Trauma Facility: `Apollo Emergency & Trauma Care`
  - Calculated ETA: `~8 mins (4.2 km straight-line Haversine estimate)`
- **Action:** Click **"Approve Dispatch"**.
- **Talking Points:**
  - *"Notice our Human-in-the-Loop safeguard: ResQFlow recommends, but the human supervisor retains ultimate authority."*
  - *"Upon clicking Approve, the state transitions to DISPATCHED, publishing a ResourceRecommendationApproved event to EventBridge and fanning out an alert to our Amazon SNS topic."*

---

### Minute 3:30 – 4:15 | Scene 5: Traceable Cloud Audit (EventBridge & Step Functions)
- **Action:** Click **"EventBridge Audit Stream"** (`/event-stream`) in the sidebar.
- **Action:** Show the stream of events (`IncidentReported`, `IncidentClassified`, `ResourceRecommendationCreated`, `IncidentDispatchSimulated`). Click **"Inspect JSON"** on an event to display the EventBridge payload modal.
- **Action:** Click **"Step Functions Workflows"** (`/workflows`) in the sidebar. Show the 4-step pipeline: `NormalizeInput` ➔ `RouteBySeverity` ➔ `AllocateResources` ➔ `NotifyResponders`.
- **Talking Points:**
  - *"Every action is completely traceable. We aren't mocking state changes in React memory; these are actual versioned event contracts routed through our custom event bus with a 14-day replayable archive."*

---

### Minute 4:15 – 4:45 | Scene 6: Disaster Drill & High-Concurrency Scaling
- **Action:** Click **"Disaster Drill"** in the top header.
- **Talking Points:**
  - *"To test real disaster surge, our Disaster Drill simultaneously injects 3 multi-tier emergencies across Hyderabad."*
  - *"Observe how Step Functions parallelizes state machine executions with zero server provisioning."*
  - *"Navigate to 'Response Fleet & Hospitals' (`/resources`) to observe how Unit Alpha and Unit Bravo are dynamically updated to DISPATCHED status."*

---

### Minute 4:45 – 5:00 | Scene 7: Cost Model & Architectural Integrity
- **Talking Points:**
  - *"To summarize: 100% serverless, zero always-running instances, least-privilege IAM roles, automated DLQ recovery, and a total monthly operating cost of under 15 cents."*
  - *"Thank you, judges. We are now open for questions."*
