# ResQFlow Architecture Specification

## Overview
ResQFlow is an intelligent, event-driven emergency response and resource orchestration platform built natively on AWS Serverless services. The core architectural tenet is:
> **"An incident is an event."**

Amazon EventBridge operates as the central nervous system of the platform, decoupling ingestion, classification, orchestration, dispatch, and observability.

---

## Architectural Diagram

```
[ Civilian / Dispatcher ]
           │
           ▼ (HTTPS POST /incidents)
[ Amazon API Gateway (HTTP API) ]
           │
           ▼
[ Ingestion Lambda (ResQFlow-IngestionFunction) ]
           ├──► [ Amazon DynamoDB (ResQFlowIncidents) ]
           │       (Writes initial incident: UNKNOWN severity, REPORTED status)
           │
           └──► [ Amazon EventBridge (resqflow-event-bus) ]
                   │
                   ├── (Rule: IncidentReported)
                   ▼
       [ Classifier Lambda (ResQFlow-ClassifierFunction) ]
                   ├──► Evaluates deterministic business rules (peopleAffected)
                   ├──► Updates DynamoDB with Category, Severity, Summary
                   └──► Emits `IncidentClassified` event to EventBridge
                           │
                           ├── (Rule: IncidentClassified)
                           ▼
               [ AWS Step Functions (ResQFlowIncidentWorkflow) ]
                   ├── Choice: CRITICAL / HIGH / MEDIUM
                   ├── Task: [ Resource Allocation Lambda ]
                   │            ├── Assigns specialized response units & hospitals
                   │            ├── Updates DynamoDB status: DISPATCHED
                   │            └── Emits `ResourceAllocated` & `TeamDispatched`
                   ├── Task: [ Notification Lambda ]
                   │            └── Broadcasts alert to [ Amazon SNS (ResQFlowAlerts) ]
                   └── Choice / Pass: WorkflowCompleted

[ React + Vite Command Center Dashboard ]
           │ (Polls GET /incidents & displays real-time status)
           ▼
[ Amazon API Gateway (HTTP API) ]
```

---

## Primary AWS Components
1. **Amazon API Gateway (HTTP API)**: Provides low-latency, cost-effective RESTful entry point with CORS.
2. **AWS Lambda (Python 3.12)**: Stateless microservices executing business logic with minimal execution footprint.
3. **Amazon DynamoDB**: Single-table NoSQL operational store using `PAY_PER_REQUEST` billing mode.
4. **Amazon EventBridge**: Custom event bus (`resqflow-event-bus`) routing domain events with schema consistency.
5. **AWS Step Functions**: Resilient state machine coordinating multi-step dispatch and alerting with built-in retries.
6. **Amazon SNS**: Instant multi-channel alert delivery for field responders and hospital personnel.
7. **Amazon CloudWatch**: End-to-end structured logging, tracing, and metric collection.
