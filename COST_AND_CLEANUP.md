# ResQFlow — Cost Model & Infrastructure Cleanup Guide

> **Target Cloud Region:** AWS Asia Pacific (Hyderabad) `ap-south-2`  
> **Architecture Profile:** 100% Serverless Pay-Per-Request (Zero Idle Cost)  
> **Safety Directive:** Never change account billing settings, payment methods, or delete unrelated user resources.

---

## 1. Hackathon Cost Breakdown

ResQFlow was architected specifically to eliminate "zombie resource" charges (such as NAT Gateways, idle EC2 instances, OpenSearch nodes, or RDS Aurora clusters). Every deployed component is strictly **on-demand**.

| AWS Service | Pricing Model | AWS Free Tier Allowance | Estimated Hackathon Usage | Monthly Cost |
|---|---|---|---|---|
| **Amazon API Gateway (HTTP API v2)** | $1.00 per million requests | 1,000,000 requests/month | ~10,000 requests | **$0.00** |
| **AWS Lambda (ARM64 Graviton2)** | $0.20 per million invocations | 1,000,000 requests & 3.2M sec/mo | ~30,000 invocations | **$0.00** |
| **Amazon DynamoDB (Pay-Per-Request)** | $1.25 / 1M writes; $0.25 / 1M reads | 25 GB storage + 25 WCU/RCU | ~5,000 items (<10 MB) | **$0.00** |
| **Amazon EventBridge** | $1.00 per million custom events | 1,000,000 events/month | ~15,000 events | **$0.00** |
| **AWS Step Functions (Standard)** | $0.025 per 1,000 state transitions | 4,000 transitions/month | ~2,000 transitions | **$0.00** |
| **Amazon SNS** | $0.50 per million publishes | 1,000,000 publishes/month | ~1,000 publishes | **$0.00** |
| **Amazon SQS** | $0.40 per million requests | 1,000,000 requests/month | ~5,000 messages | **$0.00** |
| **Amazon CloudWatch** | $0.50 per GB ingested | 5 GB log data ingestion | ~0.2 GB logs | **$0.00** |
| **Total Estimated Cost:** | | | | **$0.00 – $0.15** |

---

## 2. Cost Guardrails & Active Protections

1. **API Gateway Rate Throttling:** Capped at 50 requests/sec to prevent bill shock from accidental infinite client loops.
2. **CloudWatch Log Retention:** Log groups configured with 14-day expiration to prevent indefinite storage accumulation.
3. **EventBridge Archive Expiration:** Capped at 14 days retention.
4. **Zero Persistent Compute:** No EC2 instances, ECS tasks, or NAT Gateways exist anywhere in this template.

---

## 3. Infrastructure Teardown & Cleanup

When the hackathon evaluation is concluded and resources are no longer required, the entire cloud stack can be removed cleanly using AWS SAM or CloudFormation:

### Automated Stack Deletion
```bash
cd infrastructure
sam delete --stack-name ResQFlowStack --region ap-south-2
```

### Verification Checklist After Deletion
Run the following verification commands to ensure no orphan resources remain:

```bash
# Verify CloudFormation stack is deleted
aws cloudformation describe-stacks --stack-name ResQFlowStack --region ap-south-2

# Verify DynamoDB table is purged
aws dynamodb describe-table --table-name ResQFlowIncidents --region ap-south-2

# Verify EventBridge bus is purged
aws events describe-event-bus --name resqflow-event-bus --region ap-south-2
```
