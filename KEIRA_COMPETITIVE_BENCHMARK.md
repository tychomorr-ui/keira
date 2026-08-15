# KEIRA Competitive Capability Benchmark

## Benchmark Input Set

The review compares KEIRA with the six product patterns most relevant to a sovereign conversational intelligence node:

1. **ChatGPT** — multimodal conversation, voice, memory, tools, and research workflow.
2. **Claude** — long-context reasoning, artifacts, research, and connected knowledge sources.
3. **Gemini** — multimodal interaction, research, live information, and workspace integration.
4. **Perplexity** — citation-grounded research and source-first answer presentation.
5. **Grok** — real-time information orientation and voice-forward conversational interaction.
6. **Microsoft Copilot** — workplace grounding, retrieval, and task-oriented assistance.

## Evaluation Standard

Each pattern will be classified as one of the following:

| Classification | Meaning |
|---|---|
| Build now | Can be implemented in KEIRA’s existing React, tRPC, AWS Bedrock, database, and browser runtime without adding unsupported claims. |
| Provider-dependent | Requires a configured model/provider feature, external data source, or paid API. |
| Browser-dependent | Requires user browser support for capabilities such as speech input or output. |
| Defer | Does not strengthen KEIRA’s core role as a sovereign conversational intelligence node enough to justify present complexity. |

## Verified Market Patterns

| Product pattern | Verified capability | KEIRA implication | Classification |
|---|---|---|---|
| ChatGPT deep research | Multi-step web research presents sources, progress, and a report inside the conversation. | Add an explicit research workflow only when a real search provider is configured; show sources and progress rather than simulating research activity. | Provider-dependent |
| ChatGPT memory | Users can inspect, edit, and disable remembered context and see which sources informed personalization. | Add operator-visible memory controls and a compact context ledger before expanding autonomous memory. | Build now |
| ChatGPT voice | Voice supports interruption, selectable voices, transcript review, and live conversation flow. | Preserve the browser voice fallback, but add voice-state disclosure and transcript continuity; premium natural voice quality requires a configured speech provider. | Browser/provider-dependent |
| Claude projects and artifacts | Curated project knowledge plus project instructions reduce cold-start friction; artifacts provide a dedicated work-product surface. | Add user-managed conversation context and a lightweight work-product panel before attempting a broad multi-agent architecture. | Build now |
| Claude context engineering | High-signal, minimal context and structured memory are more reliable than indiscriminate historic context injection. | Continue replacing Mirror-heavy prompt context with transparent, relevant context selected for the active request. | Build now |
| Claude tool use | Tools are explicit contracts with clear input and execution boundaries. | Expose only a small set of real, auditable KEIRA tools; do not imply browsing, live data, or actions when no provider is configured. | Build now |
| Gemini Deep Research | A user-visible plan, source selection, iterative search, and report flow keeps long research inspectable. | Add a research-mode contract with explicit scope, sources, progress, and citation output only when a real research provider is configured. | Provider-dependent |
| Gemini Live | Real-time audio interaction supports interruption, transcription, and tool calls through a streaming provider. | Browser speech remains a baseline; high-quality bidirectional voice requires a dedicated realtime provider and secure ephemeral credentials. | Provider-dependent |
| Perplexity Search | Answers foreground citations and source visibility, with research across web, files, and connected apps. | Add a source ledger and citation-first answer renderer before introducing broad search claims. | Build now for local sources; provider-dependent for web search |
| Perplexity Spaces | Reusable instruction, source, and access-control bundles organize recurring research. | Add a lightweight operator-managed context pack rather than an unbounded automatic memory system. | Build now |
| Grok Search | Live web and social-source research is represented as a distinct mode with cited outputs. | Keep research explicitly opt-in and provider-gated; do not use “live” or “current” language for model-only answers. | Provider-dependent |
| Grok Voice | Low-latency voice with interruptions, transcription, tool use, and selected voices is a separate realtime service layer. | A premium voice path is feasible only through a configured realtime audio provider; preserve browser fallback and availability disclosure. | Provider-dependent |
| Microsoft Copilot retrieval | Retrieval is grounded in permission-aware source chunks, with data kept in the controlling system. | Build explicit, operator-owned source scopes and do not ingest or expose data without a clear ownership and access boundary. | Build now for KEIRA-owned data; provider-dependent for external repositories |
| Microsoft Copilot interaction history | Prompts, responses, and citations are treated as inspectable activity history with retention and deletion controls. | Add a user-visible context ledger and deletion controls before expanding persistent memory. | Build now |
| Microsoft Copilot agents | Agents are scoped to connected data and permitted actions, not presented as unrestricted autonomy. | Keep future KEIRA tools narrow, transparent, and separately enabled. | Build now |

## Sources

1. [OpenAI — Introducing deep research](https://openai.com/index/introducing-deep-research/)
2. [OpenAI — Memory FAQ](https://help.openai.com/articles/8590148-memory-faq)
3. [OpenAI — ChatGPT Voice](https://chatgpt.com/features/voice/)
4. [Anthropic — Collaborate with Claude on Projects](https://www.anthropic.com/news/projects)
5. [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
6. [Anthropic — Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
7. [Google — Gemini Deep Research](https://gemini.google/overview/deep-research/)
8. [Google — Gemini Deep Research Workspace integration](https://blog.google/products-and-platforms/products/gemini/deep-research-workspace-app-integration/)
9. [Google AI for Developers — Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)
10. [Perplexity — Search](https://www.perplexity.ai/hub/products/search)
11. [Perplexity — Internal Knowledge Search and Spaces](https://www.perplexity.ai/hub/blog/introducing-internal-knowledge-search-and-spaces)
12. [xAI — Grok](https://x.ai/grok)
13. [xAI — Grok Voice Agent API](https://x.ai/news/grok-voice-agent-api)
14. [xAI Docs — Voice Overview](https://docs.x.ai/developers/model-capabilities/audio/voice)
15. [Microsoft — Copilot Retrieval API overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/retrieval/overview)
16. [Microsoft — Data, Privacy, and Security for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy)
17. [Microsoft — Get started with agents in Microsoft 365 Copilot](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-agents-in-the-microsoft-365-copilot-app)

## KEIRA Gap Matrix and Priority Decision

| Priority | Competitive pattern | KEIRA gap | Decision | Rationale |
|---|---|---|---|---|
| P0 | Inspectable memory and context sources | KEIRA persists conversations and preferences, but the operator cannot review, pin, correct, or remove individual context entries. | **Build now** | Inspectable memory is both a quality feature and a sovereignty feature. It prevents opaque personalization and supports the context-management principle of preserving only high-signal material.[2] [5] [16] |
| P0 | Active response calibration | The console saves temperature and sensitivity preferences, but the inference call currently uses a hard-coded temperature. | **Build now** | Existing settings must alter the real Bedrock request or be removed. This is a direct quality and truthfulness correction. |
| P0 | Conversation work products | KEIRA can export transcripts but has no structured, operator-managed evidence or decision record. | **Build now** | A small context ledger gives the operator a durable, reviewable work product without pretending to perform external research.[4] [11] |
| P1 | Citation-grounded research | KEIRA has no configured search/data provider, source retrieval contract, or cited web-answer renderer. | **Design now; gate runtime activation on a provider** | Research must be opt-in, source-visible, and honest about its provider boundary.[1] [7] [10] [12] |
| P1 | Premium realtime voice | KEIRA currently uses browser speech APIs, not a bidirectional streaming audio model. | **Design now; gate runtime activation on a provider** | Natural interruption, transcription, and low-latency audio are provider features, not a CSS upgrade.[3] [9] [13] |
| P2 | Tool/agent orchestration | KEIRA has no separately enabled tool contracts or user-granted action scopes. | **Defer until first real external integration** | A minimal, auditable tool set is safer and more reliable than a decorative “agent” layer.[6] [17] |
| P2 | Multi-agent research | KEIRA does not run specialist agents in parallel. | **Defer** | This only becomes valuable after research sources, tools, cost controls, and clear work-product boundaries exist.[5] [12] |

## Build Order

The next implementation should add **operator-owned context ledger entries**, allow the operator to **review and delete persisted context**, and route saved **response calibration into the actual Bedrock invocation**. These changes compound: they improve answer relevance, make memory inspectable, and prevent the UI from offering inert controls. Research, realtime voice, and tool orchestration will remain plainly marked as awaiting a configured provider rather than being represented as active capabilities.
