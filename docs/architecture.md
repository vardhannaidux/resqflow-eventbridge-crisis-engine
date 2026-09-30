# ResQFlow Architecture Specification

## Overview
ResQFlow is an intelligent, event-driven emergency response and resource orchestration platform built natively on AWS Serverless services. The core architectural tenet is:
> **"An incident is an event."**

Amazon EventBridge operates as the central nervous system of the platform, decoupling ingestion, classification, orchestration, dispatch, and observability.

---

## Architectural Diagram

```
[ Civilian / Dispatcher / Simulation Drill ]
           │
           ▼ (HTTPS POST /incidents or /incidents/drill)
[ Amazon API Gateway (HTTP API) ]
           │
           ▼
[ Ingestion Lambda (ResQFlow-IngestionFunction) ] ── (X-Ray Tracing Active)
           ├──► [ Amazon DynamoDB (ResQFlowIncidents) ]
           │       (Writes initial incident: UNKNOWN severity, REPORTED status)
           │
           └──► [ Amazon EventBridge (resqflow-event-bus) ]
                   │
                   ├──► [ EventBridge Archive (ResQFlow-EventArchive) ] (14-day retention for replay & audit)
                   │
                   ├── (Rule: IncidentReported) ──► [ SQS Dead-Letter Queue ] (Failure protection)
                   ▼
        [ Classifier Lambda (ResQFlow-ClassifierFunction) ] ── (X-Ray Tracing Active)
                   ├──► Evaluates deterministic triage rules (peopleAffected)
                   ├──► Updates DynamoDB with Category, Severity, Summary
                   └──► Emits `IncidentClassified` event to EventBridge
                           │
                           ├── (Rule: IncidentClassified) ──► [ SQS Dead-Letter Queue ] (Failure protection)
                           ▼
                [ AWS Step Functions (ResQFlowIncidentWorkflow) ] ── (X-Ray Tracing Active)
                   ├── NormalizeInput & ExtractDetail
                   ├── Choice: CRITICAL / HIGH / MEDIUM
                   ├── Task: [ Resource Allocation Lambda ] ── (X-Ray Tracing Active)
                   │            ├── Assigns specialized response units & hospitals
                   │            ├── Updates DynamoDB status: DISPATCHED
                   │            └── Emits `ResourceAllocated` & `TeamDispatched`
                   ├── Task: [ Notification Lambda ] ── (X-Ray Tracing Active)
                   │            └── Broadcasts alert to [ Amazon SNS (ResQFlowAlerts) ]
                   └── Choice / Pass: WorkflowCompleted

[ React + Vite Command Center Dashboard ]
           │ (Polls GET /incidents & triggers POST /incidents/drill)
           ▼
[ Amazon API Gateway (HTTP API) ]
```

---

## Primary AWS Components & Services

1. **Amazon API Gateway (HTTP API)**: Sub-10ms RESTful entry point with integrated CORS handling and zero base cost.
2. **AWS Lambda (Python 3.12)**: Stateless microservices executing business logic with minimal execution footprint and sub-second cold starts.
3. **Amazon DynamoDB**: Single-table NoSQL operational store using `PAY_PER_REQUEST` on-demand billing with optimistic concurrency locking (`version`).
4. **Amazon EventBridge**: Custom event bus (`resqflow-event-bus`) routing domain events with schema consistency.
5. **Amazon EventBridge Archive**: Comprehensive disaster event audit trail and replay capability (`ResQFlow-EventArchive`) retaining events for 14 days.
6. **Amazon SQS Dead-Letter Queue**: Circuit breaker fault recovery (`ResQFlow-DeadLetterQueue`) catching undeliverable events from EventBridge rules.
7. **AWS Step Functions**: Resilient state machine coordinating multi-step dispatch and alerting with built-in retries, input normalization, and error handling.
8. **Amazon SNS**: Instant multi-channel alert delivery for field responders and hospital personnel.
9. **AWS X-Ray**: Distributed tracing across all Lambda invocations and Step Functions workflows for end-to-end latency analysis.
10. **Amazon CloudWatch**: End-to-end structured logging, operational metrics, and alarm monitoring.
11. **AWS CloudFormation / SAM**: 100% Infrastructure as Code (IaC) deployment with deterministic repeatability.
12. **Amazon S3**: Immutable deployment artifact and template storage.

