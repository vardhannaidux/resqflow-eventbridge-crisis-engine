# ResQFlow Security Guidelines

## 1. IAM Least Privilege
- Every Lambda function has a dedicated IAM Execution Role scoped strictly to its required resources.
- Policies utilize AWS SAM managed policy templates:
  - `DynamoDBCrudPolicy` restricted to `ResQFlowIncidents`.
  - `EventBridgePutEventsPolicy` restricted to `resqflow-event-bus`.
  - `SNSPublishMessagePolicy` restricted to `ResQFlowAlerts`.
- No Lambda has `AdministratorAccess` or wildcard permissions across unneeded services.

## 2. API Validation and Sanitization
- Strict payload validation enforces:
  - Whitelisted incident categories (`FIRE`, `FLOOD`, `MEDICAL`, `ACCIDENT`, `EARTHQUAKE`, `OTHER`).
  - Integer range constraints (`peopleAffected >= 0`).
  - Coordinate boundaries (Latitude: -90 to 90, Longitude: -180 to 180).
  - Rejection of unexpected or malformed types with HTTP 400.

## 3. Secret Management & Credential Safety
- Zero hard-coded credentials in source code.
- AWS SDK automatically retrieves ephemeral credentials via IAM execution roles.
- CloudWatch logs are sanitized to prevent personal identifying information leaks.
