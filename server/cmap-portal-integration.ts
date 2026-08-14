import {
  performArchangelHandshake,
  createMissionState,
  updateMissionState,
  extractMissionIntent,
  type MissionState,
} from "./cmap-handshake";

export interface PortalMessageWithcMAP {
  content: string;
  missionState: MissionState;
  decisions: string[];
  evidence: string[];
  openQuestions: string[];
}

export async function initializecMAPSession(
  userId: number
): Promise<MissionState> {
  const handshake = await performArchangelHandshake(userId);
  const missionState = createMissionState(
    handshake.sessionId,
    handshake.missionIntent
  );
  return missionState;
}

export function processcMAPMessage(
  userMessage: string,
  currentMissionState: MissionState
): PortalMessageWithcMAP {
  // Extract mission intent from user message
  const extractedIntent = extractMissionIntent(userMessage);

  // Update mission state with new intent if provided
  const updatedMissionState = updateMissionState(currentMissionState, {
    missionIntent:
      extractedIntent !== "Awaiting Intent"
        ? extractedIntent
        : currentMissionState.missionIntent,
  });

  return {
    content: userMessage,
    missionState: updatedMissionState,
    decisions: updatedMissionState.decisions,
    evidence: updatedMissionState.evidence,
    openQuestions: updatedMissionState.openQuestions,
  };
}

export function extractLivingContext(
  portalResponse: string,
  currentMissionState: MissionState
): Partial<MissionState> {
  const updates: Partial<MissionState> = {};

  // Simple extraction: look for decision patterns
  if (
    portalResponse.toLowerCase().includes("decision") ||
    portalResponse.toLowerCase().includes("decided")
  ) {
    const sentences = portalResponse.split(/[.!?]+/);
    const decisionSentence = sentences.find((s) =>
      s.toLowerCase().includes("decision")
    );
    if (decisionSentence) {
      updates.decisions = [
        ...currentMissionState.decisions,
        decisionSentence.trim(),
      ];
    }
  }

  // Look for evidence patterns
  if (
    portalResponse.toLowerCase().includes("evidence") ||
    portalResponse.toLowerCase().includes("data") ||
    portalResponse.toLowerCase().includes("fact")
  ) {
    const sentences = portalResponse.split(/[.!?]+/);
    const evidenceSentence = sentences.find(
      (s) =>
        s.toLowerCase().includes("evidence") ||
        s.toLowerCase().includes("data")
    );
    if (evidenceSentence) {
      updates.evidence = [
        ...currentMissionState.evidence,
        evidenceSentence.trim(),
      ];
    }
  }

  // Look for complete question sentences without swallowing prior evidence.
  const questions = portalResponse.match(/[^.!?]*\?/g)?.map((question) => question.trim()).filter(Boolean) ?? [];
  if (questions.length > 0) {
    updates.openQuestions = [...currentMissionState.openQuestions, ...questions];
  }

  return updates;
}

export function buildcMAPContext(missionState: MissionState): string {
  const contextLines: string[] = [];

  contextLines.push(`Mission: ${missionState.missionIntent}`);
  contextLines.push(`Status: ${missionState.missionStatus}`);

  if (missionState.decisions.length > 0) {
    contextLines.push(`\nDecisions Made:`);
    missionState.decisions.forEach((d) => contextLines.push(`- ${d}`));
  }

  if (missionState.evidence.length > 0) {
    contextLines.push(`\nEvidence:`);
    missionState.evidence.forEach((e) => contextLines.push(`- ${e}`));
  }

  if (missionState.openQuestions.length > 0) {
    contextLines.push(`\nOpen Questions:`);
    missionState.openQuestions.forEach((q) => contextLines.push(`- ${q}`));
  }

  contextLines.push(`\nNext Action: ${missionState.nextAction}`);

  return contextLines.join("\n");
}
