# ResQFlow — Deployment & Infrastructure Provisioning Guide

> **Cloud Infrastructure:** AWS Serverless Application Model (SAM)  
> **Target Cloud Region:** `ap-south-2` (Hyderabad)  
> **Safety Directive:** Zero destructive commands. Always generate change sets before applying infrastructure changes.

---

## 1. Prerequisites

Before deploying ResQFlow to AWS, ensure the following tools are installed:

1. **AWS CLI v2:** Configured with valid credentials and default region `ap-south-2`.
   ```bash
   aws configure
   # Default region name: ap-south-2
   ```
2. **AWS SAM CLI:** Version 1.100.0 or higher.
   ```bash
   sam --version
   ```
3. **Python:** 3.12+ (matching the Lambda runtime).
4. **Node.js:** v18+ and npm.

---

## 2. Infrastructure as Code (SAM Deployment)

The complete cloud infrastructure is codified in [`infrastructure/template.yaml`](file:///c:/Users/DELL/OneDrive/Desktop/AWS/ResQFlow/infrastructure/template.yaml).

### Step 1: Validate CloudFormation Template
```bash
cd infrastructure
sam validate --lint
```

### Step 2: Build Serverless Artifacts
```bash
sam build --use-container
```
*(Note: `--use-container` compiles Python dependencies matching the ARM64 Graviton2 Lambda environment).*

### Step 3: Deploy with Preview (Guided or Change Set)
```bash
sam deploy --guided
```

When prompted:
- **Stack Name:** `ResQFlowStack`
- **AWS Region:** `ap-south-2`
- **Parameter Environment:** `prod`
- **Confirm changes before deploy:** `Y` *(Always inspect the change set before applying)*
- **Allow SAM CLI IAM role creation:** `Y`
- **Disable rollback on failure:** `N` *(Enables automatic rollback if any resource fails)*

---

## 3. Deploying the React ATLAS Frontend

### Option A: Local Development Server (Recommended for Hackathon)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```
The application will launch immediately at `http://localhost:3000` with hot-reloading connected to the live AWS API Gateway in `ap-south-2`.

### Option B: Cloud Hosting (Amazon S3 Static Website Hosting — Live)
The frontend is provisioned and deployed to Amazon S3 in `ap-south-2` (Hyderabad):

* **S3 Hosting Bucket:** `s3://resqflow-app-621962614200`
* **Live Website URL:** [http://resqflow-app-621962614200.s3-website.ap-south-2.amazonaws.com](http://resqflow-app-621962614200.s3-website.ap-south-2.amazonaws.com)

To re-deploy updates to S3 at any time:
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://resqflow-app-621962614200 --delete
```

### Option C: Global HTTPS CDN via Amazon CloudFront
The CloudFormation template [`infrastructure/frontend-hosting.yaml`](file:///c:/Users/DELL/OneDrive/Desktop/AWS/ResQFlow/infrastructure/frontend-hosting.yaml) provisions CloudFront with Origin Access Control (OAC), HTTPS redirection, and client-side SPA routing fallbacks:

```bash
aws cloudformation create-stack \
  --stack-name ResQFlowFrontendStack \
  --template-body file://infrastructure/frontend-hosting.yaml \
  --region ap-south-2
```
*(Note: If your AWS account is brand new, AWS requires a 1-minute account verification in the AWS Support Center before creating CloudFront distributions).*

---

## 4. Environment Variables Configuration

The frontend configuration is maintained in `frontend/.env`:

```env
# AWS API Gateway Live Production Stage
VITE_API_ENDPOINT=https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com

# Target Deployment Region
VITE_AWS_REGION=ap-south-2
```

---

## 5. Rollback & Disaster Recovery Procedures

1. **Stack Rollback:** If a CloudFormation deployment fails, AWS SAM automatically executes a non-destructive rollback to the last known healthy state.
2. **Event Archive Replay:** If downstream Lambda handlers experience intermittent errors, use EventBridge archive replay to re-process failed events without requiring client resubmission:
   ```bash
   aws events start-replay \
     --replay-name "ResQFlow-IncidentReplay-01" \
     --event-source-arn "arn:aws:events:ap-south-2:123456789012:archive/ResQFlow-EventArchive" \
     --destination "arn:aws:events:ap-south-2:123456789012:event-bus/resqflow-event-bus" \
     --event-start-time "2026-10-01T00:00:00Z" \
     --event-end-time "2026-10-01T12:00:00Z"
   ```
