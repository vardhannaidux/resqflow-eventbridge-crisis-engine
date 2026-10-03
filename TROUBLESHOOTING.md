# ResQFlow — Operational Troubleshooting & Recovery Guide

> **Scope:** Common operational failure modes, recovery playbooks, and mitigation procedures for the ResQFlow serverless stack.

---

## 1. Issue: Amazon Bedrock Model Access Error

### Symptoms
- Classifier Lambda logs: `botocore.exceptions.ClientError: An error occurred (AccessDeniedException) when calling the InvokeModel operation: Your account is not authorized to invoke this model.`

### Root Cause
- Foundation model access (e.g. Anthropic Claude 3 Haiku or Amazon Titan) has not been explicitly granted on the AWS account in the AWS Console Bedrock Model Access page.

### Mitigation & Recovery
- **Safe Fallback Active:** ResQFlow features an automatic fallback to the **Deterministic Rule Engine v2.1**.
- Triage continues without interruption using rule heuristics in <85ms.
- To request model access in AWS:
  1. Open AWS Management Console ➔ Amazon Bedrock ➔ Model Access.
  2. Select Claude 3 Haiku or Amazon Titan ➔ Click "Submit Use Case / Request Access".
  3. Wait for approval notification before enabling Bedrock feature flag.

---

## 2. Issue: DynamoDB Conditional Check Failure (Version Conflict)

### Symptoms
- Lambda logs show: `ConditionalCheckFailedException: The conditional request failed`.
- API returns HTTP 409 or 400.

### Root Cause
- Optimistic Concurrency Control (OCC) detected that two dispatchers or automated processes attempted to modify the same incident record simultaneously.

### Mitigation & Recovery
- The client should fetch the latest incident version (`GET /incidents/{incidentId}`) and re-submit the update with the incremented version attribute.

---

## 3. Issue: Event Dropped to Dead-Letter Queue (DLQ)

### Symptoms
- Step Functions workflow state fails or records an execution catch.
- Message count increases in `ResQFlow-DeadLetterQueue`.

### Root Cause
- Malformed payload or unhandled external service timeout.

### Recovery Procedure
1. Inspect the message in SQS:
   ```bash
   aws sqs receive-message \
     --queue-url "https://sqs.ap-south-2.amazonaws.com/123456789012/ResQFlow-DeadLetterQueue" \
     --max-number-of-messages 1 \
     --region ap-south-2
   ```
2. Diagnose error in message attributes (`ErrorMessage`, `FailedState`).
3. Correct root cause and replay using AWS SQS Redrive:
   ```bash
   aws sqs start-message-move-task \
     --source-arn "arn:aws:sqs:ap-south-2:123456789012:ResQFlow-DeadLetterQueue" \
     --destination-arn "arn:aws:sqs:ap-south-2:123456789012:ResQFlow-AlertAuditQueue" \
     --region ap-south-2
   ```

---

## 4. Issue: Frontend Localhost Port 3000 Conflict

### Symptoms
- Terminal warning: `Port 3000 is in use, trying another port...`

### Mitigation & Recovery
- Check what process is using port 3000:
  ```powershell
  Get-NetTCPConnection -LocalPort 3000
  ```
- Alternatively, run Vite on an explicit custom port:
  ```bash
  npm run dev -- --port 3005
  ```

---

## 5. Issue: Running Entire System Completely Offline

### Symptoms
- No internet access or AWS credentials expired during hackathon venue setup.

### Solution: Built-In Python Local Serverless Simulator
ResQFlow includes a standalone Python simulator that mimics API Gateway, DynamoDB, EventBridge, Lambda, Step Functions, and SNS locally:

```bash
# Start local serverless simulator on port 3001
python local_runner.py
```

In the Frontend Settings page (`/settings`):
- Click **"Local Python Simulator (3001)"** or enter `http://localhost:3001`.
- Click **"Update Endpoint"**.
- Full application runs 100% offline with zero external cloud dependencies.
