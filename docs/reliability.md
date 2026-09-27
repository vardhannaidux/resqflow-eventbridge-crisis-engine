# ResQFlow Reliability and Fault Tolerance

## 1. Idempotency Pattern
To guarantee exactly-once processing semantics across asynchronous event consumers:
- Each event carries an `idempotencyKey` formatted as `<incidentId>:<DetailType>:<sequence>`.
- DynamoDB conditional writes verify `attribute_not_exists(lastEventId) OR lastEventId <> :eid`.
- Duplicate event deliveries are detected immediately and dropped without re-executing resource allocation or duplicate alert broadcasts.

## 2. Step Functions Retries & Backoff
All mission-critical Step Functions task states specify automated exponential backoff retries:
- `IntervalSeconds`: 2
- `MaxAttempts`: 3
- `BackoffRate`: 2.0
- Handled error codes: `Lambda.ServiceException`, `Lambda.AWSLambdaException`, `Lambda.SdkClientException`.

## 3. Graceful Failure Catching
- Any unhandled exceptions route directly to a dedicated `WorkflowFailed` state.
- Ensures state machines terminate cleanly with full diagnostic error payloads rather than hanging indefinitely.

## 4. Serverless Pay-Per-Request Resilience
- DynamoDB `PAY_PER_REQUEST` scales automatically from 0 to thousands of concurrent requests without manual capacity management or throttling risk during sudden regional disasters.
