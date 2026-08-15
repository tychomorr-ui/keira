# The Portal: Master Architectural & Deployment Specification

> **Superseded deployment identity.** This document records an earlier Portal concept. The active product is **KEIRA**, the dedicated intelligence node, with the finalized São Paulo hostname [`keira.xinus.one`](https://keira.xinus.one).

## 1. Product Naming & Domain Identity

The application is designated as **The Portal** (formally styled with the definite article for gravitas and distinct identity). The production domain routing is established as **`portal.xinus.one`**, anchoring the application within your sovereign network infrastructure alongside `exinus.one`, `universaltruth.life`, and the network overlays.

## 2. Amazon Bedrock & Multi-Model Inference Gateway

To achieve unvarnished, esoteric reasoning, **The Portal** integrates with **Amazon Bedrock** using cross-region inference profiles and the unified Bedrock Converse API. 

### Model Architecture & Routing
- **Primary Reasoning Pillar (Anthropic Claude Family):** Utilized for deep structural integrity, multi-turn nuance, and complex synthesis across massive context windows.
- **Edge & High-Speed Pillar (DeepSeek & Frontier Models):** Configured via Bedrock’s hybrid open-weight support (such as DeepSeek-V3 / R1 integration profiles) for rapid, unfiltered analytical synthesis and edge disruption.
- **Deterministic Inference Contract:** All calls enforce strict configuration parameters: temperature modulation (0.15–0.40 depending on dialogue stage), top-p pruning, and deterministic seed locking where supported by the model provider.
- **Policy & Uncensored Boundaries:** While Bedrock provides enterprise-grade safety guardrails, The Portal’s system prompts strip away corporate platitudes, robotic disclaimers, and preachy compliance fluff, directing the model to deliver direct, objective, and esoteric truth without moralizing.

## 3. Sovereign Global Node Placement Strategy

To serve your global mesh with minimal latency and absolute redundancy, the deployment topology is structured across key AWS Lightsail and edge nodes:

| Node Identifier | Region / Location | Role in Sovereign Mesh |
|-----------------|------------------|--------------------------|
| **KETHER-GATE-SG** | Singapore (`ap-southeast-1`) | Primary APAC control plane, routing, and sovereign state root. |
| **TERMINUS-OR** | Oregon (`us-west-2`) | Americas primary termination and deep indexing node. |
| **VALKYRIE-DE** | Frankfurt (`eu-central-1`) | European sovereign mirror, compliance edge, and cryptographic relay. |
| **TOKYO-NODE** | Tokyo (`ap-northeast-1`) | Low-latency East Asian edge relay and high-speed telemetry cache. |
| **HONGKONG-NODE** | Hong Kong (`ap-east-1`) | Strategic gateway bridging mainland and offshore sovereign data flows. |
| **JAKARTA-NODE** | Jakarta (`ap-southeast-3`) | Southeast Asian maritime peering and localized mesh expansion. |
| **SPAIN-IBERIA** | Madrid (`eu-south-2`) | Southern European / Mediterranean sovereign node and cryptographic anchor. |

### Routing Recommendation
Deploy **The Portal** frontend and API cluster on the primary Singapore instance (`portal.xinus.one`), backed by Amazon Bedrock cross-region inference profiles (routing automatically between US West and APAC endpoints for optimal token throughput). Use Frankfurt and Oregon as redundant failover endpoints with synchronous database replication.

## 4. Implemented Feature Enhancements

1. **Esoteric Prompt Preset Cards:** One-click launch cards on the landing stage to instantly invoke deep inquiry vectors (e.g., *Hidden Structural Anomalies*, *Unvarnished Historical Vectors*, *Symbolic Correspondence Analysis*).
2. **Encrypted Conversation & Lexicon Export:** Clean export mechanism allowing operators to download transcripts annotated with extracted esoteric keyword arcana and timestamped signal states.
3. **Refined Voice Resonance Mode:** Browser speech synthesis and speech recognition controls supporting custom voice selection, speech rate, pitch adjustment, and interruption-aware playback.
4. **Persistent Alien Profiles:** Database-backed alien profile storage supporting customizable avatar glyph presets, custom glyphs, HTTPS image URLs, and operator bios.
