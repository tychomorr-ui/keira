# Cosmic Mesh Activation Protocol (cMAP) Architecture

## Overview

The Cosmic Mesh Activation Protocol (cMAP) is the session runtime architecture that transforms the Portal Chat from a conventional chatbot into a world-class cognitive operating system. cMAP establishes intelligent awareness between the operator and the Portal before conversation begins, enabling the system to maintain coherent mission context throughout the session.

cMAP is not an AI model. It is the handshake protocol that enables the Portal to understand the operator's true intent, available context, active projects, and next recommended actions—creating a living cognitive workspace rather than a stateless conversation interface.

## Core Principles

**Clarity over Complexity**: Every element serves a purpose. Unnecessary UI, features, or telemetry are removed.

**Coherence over Features**: The system maintains a single, coherent mission thread rather than fragmenting into multiple conversations.

**Presence over Animation**: The interface feels quiet, focused, and intelligent. Animation is used only to clarify state, never to decorate.

**Truth over Decoration**: Real system state is displayed. If information is unavailable, the system displays "Awaiting Handshake" rather than fabricating telemetry.

## cMAP Architecture

### 1. Archangel Handshake

The Archangel Handshake is the silent initialization protocol that runs before conversation begins. It establishes:

**Identity**: Who is the operator? What is their role, subscription tier, and historical context?

**Intent**: What is the operator trying to accomplish in this session? What problem are they solving?

**Context**: What projects, documents, or evidence already exist? What has been previously established?

**Memory**: What patterns, breakthroughs, or resistance points are known about this operator?

**Capabilities**: What tools, integrations, and features are available in the current session?

**Objective**: What is the primary mission for this session? What is the next recommended action?

The handshake completes silently. The operator never sees a loading screen or initialization dialog. The Portal simply begins the session with full awareness.

### 2. Session State Schema

Every session maintains a persistent state object:

```typescript
interface cMAPSessionState {
  // Identity
  operatorId: string;
  operatorRole: "user" | "admin" | "analyst";
  operatorTier: "free" | "pro" | "enterprise";

  // Intent
  sessionIntent: string; // What is the operator trying to accomplish?
  primaryMission: string; // The core mission for this session
  missionStatus: "active" | "paused" | "completed";

  // Context
  activeProject: string; // Current project ID
  activeProjectContext: Record<string, unknown>; // Project-specific data
  previousSessions: SessionReference[]; // Links to relevant past sessions
  evidenceVault: Evidence[]; // Collected facts, documents, decisions

  // Memory
  operatorPatterns: Pattern[]; // Known patterns and preferences
  breakthroughMoments: Breakthrough[]; // Transformation points
  resistancePoints: ResistancePoint[]; // Known obstacles

  // Capabilities
  availableTools: ToolCapability[]; // Accessible integrations and features
  activeFeatures: string[]; // Enabled features for this session

  // Objective
  nextRecommendedAction: string; // What should happen next?
  openQuestions: Question[]; // Unanswered questions blocking progress
  decisions: Decision[]; // Decisions made in this session
}
```

### 3. Living Context Organization

Throughout the session, the Portal organizes conversation into five categories:

**Decisions**: Choices made, commitments established, directions chosen.

**Evidence**: Facts, documents, data points, and supporting information.

**Open Questions**: Unanswered questions that block progress or require clarification.

**Artifacts**: Generated outputs, code, documents, or assets created during the session.

**Next Actions**: Recommended steps, follow-ups, or tasks to complete the mission.

The Portal references this context naturally during conversation, avoiding repetitive questions and maintaining coherent mission awareness.

### 4. Mission Console Interface

The frontend interface is redesigned as a Calm Mission Console—a minimal, focused workspace that prioritizes clarity and presence.

**Core Elements**:
- **Mission Header**: Current mission, status, and primary objective
- **Context Panel**: Active project, relevant evidence, and previous decisions
- **Conversation Area**: Main interaction space with the Portal
- **Living Context Sidebar**: Decisions, Evidence, Questions, Artifacts, Next Actions
- **Status Indicator**: Current session state and handshake status

Every visible element answers the question: "Does this help the operator maintain awareness?" If not, it is removed.

### 5. Handshake Flow

1. **Session Initialization**: Operator opens Portal
2. **Identity Detection**: System identifies operator and retrieves profile
3. **Context Retrieval**: System gathers active projects, previous sessions, and evidence vault
4. **Intent Inference**: System analyzes operator's initial message (or lack thereof) to infer primary mission
5. **Capability Loading**: System determines available tools and features
6. **State Establishment**: cMAP session state is fully populated
7. **Conversation Ready**: Portal begins conversation with full awareness

The entire handshake completes in milliseconds. The operator perceives a single, coherent system rather than a series of initialization steps.

### 6. Session Persistence

cMAP session state persists throughout the operator's session. If the operator closes and reopens the Portal, the system:

1. Detects the operator's return
2. Retrieves the previous session state
3. Determines if the mission is still active
4. Resumes conversation with full context

The operator never loses mission context, even across multiple sessions.

## Integration with Trifecta Backend

The Trifecta Portal Chat backend (Grok/ChatGPT/Claude orchestration) receives cMAP session state as context for every message:

1. **System Prompt Enhancement**: The Trifecta system prompt is enhanced with current mission state, decisions, evidence, and open questions
2. **Strategy Selection**: The auto-detection layer uses mission state to determine optimal strategy (Edge/Logic/Utility)
3. **Persona Selection**: The personality manifestation layer uses mission state and operator patterns to select optimal persona
4. **Context Injection**: Living context is injected into the LLM prompt to maintain coherence

The result is a Portal that feels like it understands the operator's mission and maintains intelligent awareness throughout the conversation.

## Design Philosophy

The Portal should feel quiet, focused, and intelligent. When an operator opens it, they should immediately feel that they have connected to a living cognitive workspace rather than a conventional chatbot.

**Avoid**:
- Fake metrics or simulated telemetry
- Unnecessary animations or decorations
- Repetitive questions about previously established context
- Feature bloat or UI clutter
- Generic chatbot behavior

**Embrace**:
- Real system state and honest "Awaiting Handshake" messages
- Minimal, focused interface
- Natural context reference and mission coherence
- Quiet, intelligent presence
- Inevitable design that feels like it had to be this way

---

**Author**: Manus AI
**Version**: 1.0.0
**Date**: August 3, 2026
