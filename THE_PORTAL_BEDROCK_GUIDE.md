# The Portal: Amazon Bedrock Activation & Cross-Region Routing Guide

This document provides the definitive operational blueprint for enabling high-performance frontier model access and cross-region inference profiles for **The Portal**. By leveraging Amazon Bedrock, The Portal establishes a deterministic, uncensored, and low-latency cognitive engine without third-party mediation.

---

## 1. Amazon Bedrock Console Model Activation Checklist

To enable foundation models such as Anthropic Claude and DeepSeek (when available via Bedrock marketplace/third-party offerings) for The Portal, follow this strict console sequence:

1. **Console Navigation:** Log in to the **AWS Management Console** and navigate to the **Amazon Bedrock** service dashboard in your chosen primary deployment region [3].
2. **Model Access Request:** In the left-hand navigation pane, select **Model access**. Review the available foundation model offerings, locate the desired models (e.g., *Claude 3.5 Sonnet* or *Claude 3 Opus*), and click **Modify model access** or **Request model access** [2] [3].
3. **End-User Agreements:** Complete any required one-time use-case details or data-sharing compliance acknowledgments specified by the model providers, then submit the request [1].
4. **Access Verification:** Confirm that the status column changes from *Request submitted* to *Access granted* (typically instantaneous for standard commercial models).

---

## 2. Cross-Region Inference Profile Configuration

Cross-region inference profiles allow The Portal to automatically route requests across multiple AWS regions, avoiding single-region capacity constraints and minimizing latency spikes during peak utilization [8] [11].

### Understanding Inference Profile Identifiers
Instead of hardcoding a single regional model ARN (e.g., `us-east-1.anthropic.claude-3-5-sonnet...`), cross-region inference utilizes system-defined routing identifiers or geographic prefixes [8] [10]:
- **Geographic Inference Profiles:** Route traffic within a specified geopolitical boundary (e.g., US or EU) to maintain strict data governance while balancing load across underlying AWS Availability Zones and adjacent regions [8].
- **Global Inference Profiles:** Distribute inference calls globally to achieve maximum throughput and resilience [8].

### Configuring the Gateway for Inference Profiles
In **The Portal** server-side gateway (`server/bedrock-gateway.ts`), set `BEDROCK_MODEL_ID` to the system-defined cross-region inference profile ID (such as `us.anthropic.claude-3-5-sonnet-20241022-v2:0`) rather than a single zonal endpoint. This instructs the AWS Bedrock Runtime SDK to handle regional failover and latency optimization transparently.

---

## 3. IAM Least-Privilege Policy for The Portal

To secure **The Portal** server instance, attach an IAM policy restricted exclusively to Bedrock runtime invocation and inference profile resolution:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PortalBedrockInference",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetInferenceProfile",
        "bedrock:ListInferenceProfiles"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 4. Environment Variables Reference

Configure the following secrets in **The Portal** project settings or environment manager:

| Variable Name | Description | Example Value |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | IAM Access Key ID with Bedrock invocation permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Corresponding IAM Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `BEDROCK_REGION` | Primary AWS region for client initialization | `us-west-2` or `eu-central-1` |
| `BEDROCK_MODEL_ID` | Cross-region inference profile ID | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |

---

## 5. Verification & Testing

Verify connectivity and determinism by executing the test suite or invoking the health check endpoint:

```bash
pnpm test
```

When valid AWS credentials and an authorized inference profile are supplied, `server/bedrock-gateway.ts` executes a zero-latency `ConverseCommand` handshake against Amazon Bedrock, ensuring uncompromising sovereign intelligence.

---
*Author: Manus AI*
*Target Domain: portal.xinus.one*
