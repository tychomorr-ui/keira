# Sovereign Truth Trifecta Portal Chat API Documentation

This document provides detailed API documentation for the Sovereign Truth Trifecta Portal Chat, focusing on its tRPC procedures and data structures. The API is designed to facilitate seamless integration with frontend applications and external services, enabling dynamic conversational experiences.

## Base Router

The primary API endpoint is exposed via the `portalChatRouter` located in `server/trifecta-portal-router.ts`. This router consolidates all core functionalities of the Trifecta Portal Chat.

## Procedures

### 1. `sendMessage`

Handles the full orchestration of the Trifecta flow for incoming user messages. This procedure integrates the Personality Manifestation Layer, Multi-Agent Orchestration, Sovereign Truth Filter, and Real-Time Feedback Loop to generate a personalized and adaptive response.

-   **Method**: `mutation`
-   **Input**: `z.object({
    content: z.string(),
    messageId: z.string().optional(),
})`
    -   `content`: The user's message content.
    -   `messageId`: (Optional) A unique identifier for the message.
-   **Output**: `z.object({
    success: z.boolean(),
    messageId: z.string(),
    content: z.string(),
    metadata: z.object({
        strategy: z.enum(["edge", "logic", "utility"]),
        learningStage: z.string(),
        breakthroughReadiness: z.number(),
        sovereignTruthScore: z.number(),
        synthesisRationale: z.string(),
        pillarWeights: z.object({
            grok: z.number(),
            chatgpt: z.number(),
            claude: z.number(),
        }),
        tuningConfidence: z.number(),
        nextAction: z.string(),
        selectedPersona: z.string(),
        contextualOpening: z.string(),
        variabilityEntropy: z.number(),
    }),
})`
    -   `success`: Indicates if the message was processed successfully.
    -   `messageId`: The ID of the processed message.
    -   `content`: The AI's generated response.
    -   `metadata`: Comprehensive information about the AI's response generation process, including:
        -   `strategy`: The detected conversational strategy (edge, logic, or utility).
        -   `learningStage`: The user's current learning stage.
        -   `breakthroughReadiness`: A score indicating the user's readiness for a breakthrough.
        -   `sovereignTruthScore`: The overall quality score of the response.
        -   `synthesisRationale`: Explanation of how the response was synthesized from different AI pillars.
        -   `pillarWeights`: The dynamic weights applied to Grok, ChatGPT, and Claude during orchestration.
        -   `tuningConfidence`: Confidence level of the feedback loop's tuning.
        -   `nextAction`: Suggested next action for the user.
        -   `selectedPersona`: The archetypal persona chosen for the response.
        -   `contextualOpening`: The personalized greeting or acknowledgment used.
        -   `variabilityEntropy`: The entropy level applied for natural language variation.

### 2. `submitFeedback`

Processes user feedback to update the real-time feedback loop and evolve Trifecta weights. This procedure is crucial for the continuous learning and optimization of the Portal Chat.

-   **Method**: `mutation`
-   **Input**: `z.object({
    messageId: z.string(),
    personaId: z.string().optional(),
    satisfaction: z.number().min(1).max(5),
    helpfulness: z.number().min(1).max(5),
    clarity: z.number().min(1).max(5),
    truthfulness: z.number().min(1).max(5),
    novelty: z.number().min(1).max(5),
    applicability: z.number().min(1).max(5),
    engagementLevel: z.number().min(1).max(5),
    wouldRecommend: z.boolean(),
    comments: z.string().optional(),
})`
    -   `messageId`: The ID of the message being rated.
    -   `personaId`: (Optional) The ID of the persona used for the message.
    -   `satisfaction`: User's satisfaction rating (1-5).
    -   `helpfulness`: User's helpfulness rating (1-5).
    -   `clarity`: User's clarity rating (1-5).
    -   `truthfulness`: User's truthfulness rating (1-5).
    -   `novelty`: User's novelty rating (1-5).
    -   `applicability`: User's applicability rating (1-5).
    -   `engagementLevel`: User's engagement level rating (1-5).
    -   `wouldRecommend`: Boolean indicating if the user would recommend the response.
    -   `comments`: (Optional) Additional comments from the user.
-   **Output**: `z.object({
    success: z.boolean(),
    tuningUpdated: z.boolean(),
    newWeights: z.any(), // Dynamic object representing updated pillar weights
})`
    -   `success`: Indicates if the feedback was processed successfully.
    -   `tuningUpdated`: Boolean indicating if the Trifecta weights were updated.
    -   `newWeights`: The updated dynamic weights for Grok, ChatGPT, and Claude.

### 3. `getStatus`

Provides the current status of the Portal, including tuning confidence, evolution stage, and preferred personas. Useful for monitoring the system's learning progress.

-   **Method**: `query`
-   **Input**: `void`
-   **Output**: `z.object({
    tuningConfidence: z.number(),
    evolutionStage: z.string(),
    preferredPersonas: z.record(z.string(), z.number()), // Map of persona ID to preference score
    totalInteractions: z.number(),
    tuningReport: z.any(), // Detailed report on tuning status
})`
    -   `tuningConfidence`: The confidence level of the feedback loop's tuning.
    -   `evolutionStage`: The current evolution stage of the Portal (e.g., Initialization, Learning, Optimization, Mastery).
    -   `preferredPersonas`: A map indicating the user's preference for different personas.
    -   `totalInteractions`: The total number of interactions with the Portal.
    -   `tuningReport`: A detailed report on the current tuning status and recommendations.

### 4. `getBenchmarkComparison`

Compares a given response against frontier models (GPT-4o, Claude Opus, Grok) using the Sovereign Truth metrics. This procedure allows for objective evaluation of the Portal's performance.

-   **Method**: `query`
-   **Input**: `z.object({
    responseContent: z.string(),
})`
    -   `responseContent`: The content of the response to be benchmarked.
-   **Output**: `z.object({
    portal: z.any(), // SovereignTruthMetric for Portal
    gpt4o: z.any(), // SovereignTruthMetric for GPT-4o
    claudeOpus: z.any(), // SovereignTruthMetric for Claude Opus
    grok: z.any(), // SovereignTruthMetric for Grok
})`
    -   `portal`: The Sovereign Truth Metric scores for the Portal's response.
    -   `gpt4o`: The Sovereign Truth Metric scores for GPT-4o's response.
    -   `claudeOpus`: The Sovereign Truth Metric scores for Claude Opus's response.
    -   `grok`: The Sovereign Truth Metric scores for Grok's response.

## Data Structures

### `PortalMessage`

Represents a message within the Portal Chat system.

-   `messageId`: `string` - Unique identifier for the message.
-   `content`: `string` - The textual content of the message.
-   `timestamp`: `Date` - The timestamp when the message was created.

### `Message`

Represents a generic message object used internally for LLM interactions.

-   `role`: `"system" | "user" | "assistant"` - The role of the message sender.
-   `content`: `string` - The textual content of the message.

### `UserContext`

Comprehensive context object for a user, synthesized from various sources.

-   Includes data from Mirror history, learning memory, chat history, knowledge graph, and user metadata.
-   Detailed structure can be found in `server/portal-context-retrieval.ts`.

### `TrifectaTuning`

Represents the dynamic weights and configuration for the Trifecta system.

-   Includes pillar weights (Grok, ChatGPT, Claude), evolution stage, and tuning confidence.
-   Detailed structure can be found in `server/trifecta-feedback-loop.ts`.

### `PersonaProfile`

Stores user-specific preferences and performance data for different communication personas.

-   Includes preferred personas, total interactions, and feedback history.
-   Detailed structure can be found in `server/trifecta-persona-tracking.ts`.

### `SovereignTruthMetric`

Defines the metrics used to evaluate AI responses against the "Sovereign Truth" standard.

-   `domainSynthesis`: How well it synthesizes disparate domains (0-100).
-   `creativity`: How creative and novel the output is (0-100).
-   `logicalDepth`: How logically sound the reasoning is (0-100).
-   `culturalRelevance`: How culturally relevant and timely (0-100).
-   `edgeScore`: How provocative and edge-forward (0-100).
-   `sovereignTruthScore`: Overall signal-to-noise ratio (0-100).
-   Detailed structure can be found in `server/trifecta-benchmarks.ts`.

---

**Author**: Manus AI
**Version**: 1.0.0
**Date**: August 2, 2026
