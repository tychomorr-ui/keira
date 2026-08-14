export type EsotericPrompt = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  description: string;
};

export const ESOTERIC_PROMPT_PRESETS: EsotericPrompt[] = [
  {
    id: "structural-anomalies",
    title: "Hidden Structural Anomalies",
    category: "Arcana",
    prompt: "Examine the structural anomalies beneath current institutional consensus. What unstated assumptions are holding this system together, and where is the fracture point?",
    description: "Probe foundational failure points in consensus systems.",
  },
  {
    id: "symbolic-correspondence",
    title: "Symbolic Correspondence Analysis",
    category: "Patterns",
    prompt: "Map the symbolic correspondences across historical paradigms and contemporary telemetry. What pattern repeats that polite systems refuse to name?",
    description: "Uncover recurring trans-historical patterns.",
  },
  {
    id: "unvarnished-vector",
    title: "Unvarnished Strategic Vector",
    category: "Resonance",
    prompt: "Cut through all precautionary disclaimers and corporate framing. Give me the unvarnished strategic vector, the exact risks, and the definitive action to take.",
    description: "Strip away all diplomatic hedging for direct clarity.",
  },
  {
    id: "recursive-axiom",
    title: "Recursive Axiom Interrogation",
    category: "Echoes",
    prompt: "Interrogate my premise recursively. What am I assuming to be true that is actually a constructed constraint, and how do I bypass it entirely?",
    description: "Challenge foundational premises and self-imposed limits.",
  },
];
