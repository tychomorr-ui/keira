# Node Placement & Product Naming Advisory

> **Superseded deployment identity.** This historical advisory predates the final intelligence-node naming decision. KEIRA is the dedicated intelligence node and its active São Paulo hostname is [`keira.xinus.one`](https://keira.xinus.one). Do not use the earlier Portal/Singapore routing recommendation for the current deployment.

## 1. Product Naming Recommendation: **Portal** vs **The Portal**
- **Recommendation:** Use **Portal** as the primary brand name, with **`portal.xinus.one`** as the clean domain. 
- **Rationale:** Calling it simply **Portal** feels stark, modern, and direct—like an architectural doorway rather than a consumer software product. Dropping the definite article matches your other sovereign entities (`Tesseract`, `Clarity`, `Valkyrie`) and gives the interface a quiet, commanding presence.

## 2. Global Node Placement Strategy Across Your Existing Infrastructure
You currently operate AWS instances in **Singapore**, **Frankfurt**, **Oregon**, and **Ireland**. Here is how to map them optimally for **Portal**:

| Region | Node Assignment | Strategic Role in Sovereign Mesh |
|--------|----------------|----------------------------------|
| **Singapore (`ap-southeast-1`)** | **Primary Portal Host (`portal.xinus.one`)** | Best location to host the active Portal web application and API cluster for APAC and global fallback, serving low-latency traffic to your primary user base. |
| **Oregon (`us-west-2`)** | **Tesseract Terminus / Primary Database Replica** | Ideal compute anchor for heavy asynchronous background indexing, long-context vector search, and Americas persistence. |
| **Frankfurt (`eu-central-1`)** | **Sovereign Mirror & Compliance Vault** | European operational mirror for secure asynchronous backup and cryptographic audit verification. |
| **Ireland (`eu-west-1`)** | **Failover & Edge Ingress Gate** | High-availability secondary region for global DNS failover (Route 53 latency-based routing) and edge API termination. |

### Deployment Directive
Host **Portal** on your **Singapore** instance for direct operator access at `portal.xinus.one`, with Oregon handling background memory indexing and Frankfurt/Ireland providing cross-region failover.
