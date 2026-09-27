# ResQFlow — Intelligent Event-Driven Emergency Response and Resource Orchestration Platform

> Built natively on AWS Serverless architecture for high-speed, reliable emergency response dispatching in **Asia Pacific (Hyderabad) `ap-south-2`**.

---

## 🚒 Core Principle
> **"An incident is an event."**

ResQFlow leverages **Amazon EventBridge** as the central decoupled event bus, ensuring high availability, sub-second latency, deterministic rule-based triage, and seamless scaling under disaster-level load with zero always-running infrastructure.

---

## 🏛️ System Architecture

```
User / Dispatcher
       │
       ▼ (HTTPS)
Amazon API Gateway (HTTP API)
       │
       ▼
Ingestion Lambda
   ├── Writes record (Status: REPORTED, Severity: UNKNOWN) ──► Amazon DynamoDB (ResQFlowIncidents)
   └── Emits IncidentReported ──► Amazon EventBridge (resqflow-event-bus)
                                         │
                                         ▼ (Rule: IncidentReported)
                               Classifier Lambda
                                  ├── Updates DynamoDB (Severity, Category, Summary)
                                  └── Emits IncidentClassified ──► EventBridge
                                                                      │
                                                                      ▼ (Rule: IncidentClassified)
                                                           AWS Step Functions (ResQFlowIncidentWorkflow)
                                                              ├── Route by Severity (CRITICAL / HIGH / MEDIUM)
                                                              ├── Resource Allocation Lambda (Assigns ERT / Hospital)
                                                              └── Notification Lambda ──► Amazon SNS (ResQFlowAlerts)
```

---

## 📂 Repository Structure

```
ResQFlow/
│
├── README.md
│
├── backend/
│   ├── ingestion/             # Ingestion Lambda (POST /incidents, GET /incidents)
│   ├── classifier/            # Deterministic triage Lambda
│   ├── resource/              # Emergency resource assignment Lambda
│   ├── notification/          # Multi-channel SNS dispatch Lambda
│   ├── common/                # Shared event envelopes, validation, idempotency
│   └── statemachines/         # Step Functions workflow ASL definition
│
├── frontend/                  # React + Vite Emergency Command Center Dashboard
├── infrastructure/            # AWS SAM / CloudFormation template (template.yaml)
├── events/                    # EventBridge JSON test payloads
├── docs/                      # Architecture, event catalog, security, reliability, demo guides
└── tests/                     # Unit, integration, and failure test suites
```

---

## 🚀 Deployment Instructions

### Prerequisites
- AWS CLI v2 configured with region `ap-south-2`
- AWS SAM CLI installed
- Python 3.12+ and Node.js v18+

### Deploying Infrastructure
From the `infrastructure` directory:

```bash
cd infrastructure
sam build
sam deploy --guided
```

Provide the deployment parameters:
- **Stack Name**: `ResQFlowStack`
- **AWS Region**: `ap-south-2`
- **Confirm changes before deploy**: `N`
- **Allow SAM CLI IAM role creation**: `Y`

---

## 🧪 Testing Locally

Run unit tests:
```bash
pytest tests/unit/
```

Run failure recovery tests:
```bash
pytest tests/failure/
```

---

## 🛡️ Reliability & Safety
- **Pay-Per-Request**: DynamoDB on-demand mode protects against idle costs and traffic spikes.
- **Idempotency**: DynamoDB conditional expressions prevent duplicate dispatches.
- **Circuit-Safe State Machine**: Step Functions retries with exponential backoff on transient errors.
- **Least Privilege**: Dedicated IAM roles for each Lambda microservice.
