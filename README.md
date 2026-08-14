# Sovereign Truth Trifecta Portal Chat

## Overview

The Sovereign Truth Trifecta Portal Chat is a world-class conversational AI system designed to transcend the capabilities of existing frontier models like ChatGPT, Claude, and Grok. It achieves this by integrating their strengths into a unified, adaptive, and evolutionary intelligence. The system features a dynamic personality manifestation layer, multi-agent orchestration, a sovereign truth filter, real-time feedback loops, and advanced contextual understanding to provide deeply personalized and transformative interactions.

## Key Features

- **Unified Personality Core**: A fluid persona that dynamically adapts its communication style based on user intent, sentiment, and the system's evolutionary stage. It leads with Claude's reasoning precision, executes with ChatGPT's interface efficiency, and concludes with Grok's provocative, high-value insights.
- **Multi-Agent Orchestration**: Runs three distinct AI pillars (Grok, ChatGPT, Claude) in parallel, each contributing a specialized perspective to the conversation. This ensures comprehensive and multi-faceted responses.
- **Sovereign Truth Filter & Synthesis Engine**: Aggregates and synthesizes outputs from the parallel AI pillars, applying a 
rigorous filtering process to ensure the highest signal-to-noise ratio and maintain a consistent "Sovereign Truth" thread.
- **Dynamic Personality Manifestation Layer**: Dynamically selects communication personas (e.g., "The Pragmatic Architect," "The Exploratory Philosopher") based on user intent, conversation history, and sentiment. Includes contextual greetings, sentiment alignment, and variable response lengths to prevent robotic repetition.
- **Real-Time Feedback Loop**: Continuously evolves the Trifecta weights based on user satisfaction, truthfulness, and novelty scores, allowing the system to adapt and optimize its conversational approach over time.
- **Opinionated Analysis Engine**: Integrates real-time web scraping, market trends, and social sentiment analysis to provide the system with a "sense of the now" and offer provocative, high-value insights.
- **Long-Form Document Synthesis**: Capable of processing and synthesizing massive, complex documents with high structural integrity and infinite-token coherence, maintaining logical chains and nuance during extended interactions.
- **Synthetic Benchmark Suite**: Replaces standard unit tests with "Benchmark Stress Tests" that compare Portal’s output against leading frontier models for creativity, logical depth, and cultural relevance, defining a unique "Sovereign Truth" metric.

## Architecture

The architecture of the Sovereign Truth Trifecta Portal Chat is designed around a multi-layered, adaptive intelligence system:

1.  **Input Layer**: Processes incoming user messages, extracts intent, and analyzes sentiment.
2.  **Context Retrieval Layer**: Synthesizes Mirror history, learning memory, chat history, knowledge graph data, and user metadata to build a comprehensive user context.
3.  **Personality Manifestation Layer**: Utilizes sentiment analysis, contextual opening logic, and conversation variability to select an optimal communication persona and generate a dynamic system prompt.
4.  **Strategy Auto-Detection Layer**: Determines the optimal balance of "Edge" (Grok), "Logic" (Claude), or "Utility" (ChatGPT) required for the current interaction based on user context and intent.
5.  **Multi-Agent Orchestration Layer**: Runs Grok, ChatGPT, and Claude pillars in parallel, each with specialized system prompts and perspectives. The orchestration strategy (e.g., parallel, sequential, weighted) is dynamically chosen.
6.  **Sovereign Truth Filter & Synthesis Engine**: Receives responses from all AI pillars, scores them based on coherence, novelty, applicability, and truthfulness. It then selects the primary pillar, extracts logical chains, and synthesizes a unified, high-signal response.
7.  **Output Layer**: Delivers the synthesized response to the user, along with metadata such as the selected persona, strategy, and breakthrough indicators.
8.  **Real-Time Feedback Loop**: Collects user feedback (satisfaction, truthfulness, novelty) on each response, which is then used to update the Trifecta weights and evolve the system's conversational capabilities over time.
9.  **Learning Memory Vault**: Stores patterns, breakthroughs, resistance points, and growth areas, allowing the Portal to develop a recursive understanding of each user across sessions.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Git
- Manus Platform Account (for deployment and integrated services)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tychomorr-ui/sovereign-truth-engine.git
    cd sovereign-truth-engine
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Environment Variables:**
    This project relies on environment variables for sensitive information and configuration. These are automatically managed by the Manus Platform. For local development, you will need to set up a `.env` file. Contact your Manus administrator for local development credentials.

### Local Development

1.  **Start the development server:**
    ```bash
    pnpm dev
    ```
2.  Open your browser to `http://localhost:3000`.

## Deployment

This project is designed for seamless deployment on the Manus Platform. After committing your changes, you can deploy by clicking the "Publish" button in the Manus Management UI. For custom domains, navigate to **Settings → Domains** in the Management UI and bind your domain (e.g., `universaltruth.life`).

## API Documentation

Portal Chat functionality is exposed via tRPC procedures. The primary endpoint is `portalChatRouter` located in `server/trifecta-portal-router.ts`. Key procedures include:

-   `sendMessage`: Handles the full orchestration of the Trifecta flow for incoming user messages.
-   `submitFeedback`: Processes user feedback to update the real-time feedback loop and evolve Trifecta weights.
-   `getStatus`: Provides the current status of the Portal, including tuning confidence and evolution stage.
-   `getBenchmarkComparison`: Compares a given response against frontier models using the Sovereign Truth metrics.

Detailed API types and schemas can be found in the respective TypeScript files within the `server/` directory.

## Contributing

We welcome contributions to the Sovereign Truth Trifecta Portal Chat. Please see `CONTRIBUTING.md` for guidelines.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Security

For security-related information and how to report vulnerabilities, please refer to `SECURITY.md`.

## Changelog

See `CHANGELOG.md` for a history of changes and updates.

---

**Author**: Manus AI
**Version**: 1.0.0
**Date**: August 2, 2026
