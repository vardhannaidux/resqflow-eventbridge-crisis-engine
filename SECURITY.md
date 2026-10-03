# ResQFlow — Security Architecture, Compliance & Threat Model

> **Classification:** Security Whitepaper & Operational Guidelines  
> **Compliance Target:** Principle of Least Privilege (PoLP), OWASP Serverless Top 10

---

## 1. Authentication & Authorization Model

ResQFlow enforces security boundaries at the API Gateway and backend layers:

1. **Role-Based Access Control (RBAC):**
   - **Public / Field Caller:** Can submit initial emergency reports (`POST /incidents`).
   - **Dispatch Supervisor:** Authorized to view full dossiers, trigger drills, approve simulated dispatches, and resolve incidents.
   - **Auditor / Observer:** Read-only access to `/analytics`, `/event-stream`, and `/workflows`.
2. **Backend Enforcement:**
   Consequential state changes (approving dispatches, resolving incidents) verify operator identity on the server, not solely in the UI.

---

## 2. Principle of Least-Privilege IAM Policies

Every Lambda function and Step Functions state machine executes under a dedicated, tightly-scoped IAM execution role:

| Component | Allowed Actions | Scope / Target Resource | Wildcards |
|---|---|---|---|
| **Ingestion Lambda** | `dynamodb:PutItem`, `dynamodb:Scan`, `events:PutEvents` | `arn:aws:dynamodb:...:table/ResQFlowIncidents`<br/>`arn:aws:events:...:event-bus/resqflow-event-bus` | ❌ None |
| **Classifier Lambda** | `dynamodb:UpdateItem`, `events:PutEvents` | Specific Table & Event Bus | ❌ None |
| **Resource Lambda** | `dynamodb:UpdateItem`, `events:PutEvents` | Specific Table & Event Bus | ❌ None |
| **Notification Lambda**| `sns:Publish` | `arn:aws:sns:...:ResQFlowAlerts` | ❌ None |
| **Step Functions** | `lambda:InvokeFunction`, `sns:Publish` | Explicit Lambda ARNs & SNS Topic ARN | ❌ None |

No function has administrative privileges or access to unrelated AWS services.

---

## 3. Network & Edge Defense

1. **CORS Configuration:**
   - Allowed Origins: Configurable per environment (restricted in production; open during local hackathon testing).
   - Allowed Methods: `GET, POST, PUT, PATCH, OPTIONS`.
   - Allowed Headers: `Content-Type, Authorization, X-Operator-Id, X-Api-Key`.
2. **Optimistic Locking & State Tamper Protection:**
   - Incremental version checks (`version: N -> N+1`) prevent race conditions between automated background workers and manual dispatchers.
   - Terminal state lock prevents reopening or altering incidents marked `RESOLVED`.
2. **API Gateway Rate Throttling:**
   - **Steady-State Rate Limit:** 50 requests per second (RPS).
   - **Burst Limit:** 100 requests.
   - Mitigates automated denial-of-service (DoS) attempts and protects serverless resources from runaway billing.

---

## 4. Input Sanitization & Server-Side Validation

All inbound JSON payloads pass through a rigorous schema validator before reaching any database or event bus:

- **Type Checking:** Strict primitive validation (string, number, object).
- **String Length Limits:** Descriptions capped at 1,000 characters to prevent buffer and memory exhaustion.
- **Geographic Bounds:** Latitude strictly checked in `[-90, 90]` and Longitude in `[-180, 180]`.
- **Sanitization:** Strips HTML/script tags to prevent Cross-Site Scripting (XSS) in operational dashboards.

---

## 5. Safe Error Handling & Information Leakage Prevention

- Stack traces and internal Python exception traces are logged only to Amazon CloudWatch.
- External clients receive sanitized HTTP 400 or 500 error responses with standardized error codes (`VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
- Zero database credentials, AWS access keys, or internal IP addresses are ever returned in API responses or committed to source control.

---

## 6. Real-World Safety Safeguards

1. **Simulated Notification Guardrails:** All SNS alert topics route exclusively to registered developer endpoints and the `ResQFlow-AlertAuditQueue` SQS queue.
2. **No Public Emergency Contacting:** The platform strictly prohibits transmitting dispatches to actual civic emergency services (112, 911, fire departments) during prototype demonstrations.
3. **Transparent Simulation Tagging:** All synthetic disaster drills carry an immutable `isSimulation: true` flag in the event contract.
