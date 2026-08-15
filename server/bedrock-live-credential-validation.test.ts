import { describe, expect, it } from "vitest";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { invokeBedrock } from "./bedrock-gateway";

const shouldRunLiveBedrockProbe = process.env.RUN_BEDROCK_LIVE_TEST === "true";

describe("Bedrock bearer credential validation", () => {
  it.skipIf(!process.env.BEDROCK_API_KEY || !shouldRunLiveBedrockProbe)("makes a minimal direct gateway request without exposing the token", async () => {
    const response = await invokeBedrock({
      system: "Respond with the single word READY.",
      messages: [{ role: "user", content: "Connection check." }],
      maxTokens: 16,
      temperature: 0,
      topP: 0.1,
    });

    expect(response.content.trim().length).toBeGreaterThan(0);
    expect(response.modelId).toBe(process.env.BEDROCK_MODEL_ID);
  }, 75_000);

  it.skipIf(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !shouldRunLiveBedrockProbe)("authenticates the protected IAM key with a minimal Bedrock runtime request", async () => {
    const client = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const response = await client.send(new ConverseCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      system: [{ text: "Respond with the single word READY." }],
      messages: [{ role: "user", content: [{ text: "Connection check." }] }],
      inferenceConfig: { maxTokens: 16, temperature: 0, topP: 0.1 },
    }));

    expect(response.output?.message?.content?.some((block) => typeof block.text === "string" && block.text.length > 0)).toBe(true);
  }, 75_000);
});
