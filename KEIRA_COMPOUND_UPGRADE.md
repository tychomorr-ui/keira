# KEIRA Compound Upgrade Blueprint

## Purpose

KEIRA is the sovereign ecosystem’s **conversational intelligence node**. The product must provide direct, useful answers by default; retain reflective depth only when the operator requests it; and show real capability state rather than simulated operational certainty.

## Implemented Capability Model

| Layer | Implemented behavior | Truthfulness boundary |
|---|---|---|
| Conversation | Current-message intent is evaluated before historic stage metadata. Direct requests use the informative strategy. | KEIRA does not infer motive, pathology, avoidance, or hidden meaning from ordinary wording. |
| Reflection | Socratic, forensic, prophetic, and catalytic strategies remain available only when the operator explicitly invites reflection or challenge. | Scenario discussion is labeled as possibility, not foreknowledge. |
| Context | Conversation history and saved preferences provide fallible background context. | Legacy Mirror-derived labels are not treated as diagnoses or privileged truth. |
| Capabilities | The authenticated console lists reasoning, continuity, export, voice, and personalization status through a real API procedure. | The procedure never exposes credentials, model IDs, storage locations, or infrastructure topology. |
| Voice | Browser speech input and output are detected at runtime; users can save browser voice preferences. | Voice support is reported as browser-dependent. The interface does not pretend an animated waveform is audio analysis. |
| Personalization | Operators can save persona, instructions, response variation, context sensitivity, avatar, biography, and voice preferences. | Preferences shape the response but do not create unsupported capabilities. |

## Operator Interaction Contract

KEIRA follows this response order:

1. **Answer the active request.**
2. **State uncertainty, constraints, or missing evidence when material.**
3. **Offer structure, examples, options, or a next step when useful.**
4. **Offer reflection as an option rather than inserting it by default.**

This makes the intelligence node suitable for factual research, technical reasoning, planning, creative work, esoteric inquiry, and invited introspection without changing its personality into a generic assistant.

## Verified Release Gate

The compound upgrade is accepted only when the following checks pass:

- Full Vitest regression suite, including direct-information routing, reflective opt-in, respectful personal/spiritual handling, and capability-inventory coverage.
- Strict TypeScript compilation.
- Production build.
- Deployment-script syntax validation.
- Git diff whitespace validation.

## Deployment Boundary

The São Paulo instance must use the dedicated `tychomorr-ui/keira` repository and its local `.env` configuration. No environment secret, owner token, database credential, Bedrock credential, or S3 setting is committed to this repository.
