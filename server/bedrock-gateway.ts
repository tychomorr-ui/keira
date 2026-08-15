import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
  type Message as BedrockMessage,
} from "@aws-sdk/client-bedrock-runtime";
import { ENV } from "./_core/env";

export type BedrockRole = "user" | "assistant";

export type BedrockChatMessage = {
  role: BedrockRole;
  content: string;
};

export type BedrockGatewayRequest = {
  system: string;
  messages: BedrockChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
};

export type BedrockGatewayResponse = {
  content: string;
  modelId: string;
  stopReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export type BedrockAuthMode = "bearer" | "iam" | "none";

let client: BedrockRuntimeClient | null = null;

export function getBedrockAuthMode(): BedrockAuthMode {
  if (ENV.bedrockApiKey) return "bearer";
  if (ENV.awsAccessKeyId && ENV.awsSecretAccessKey) return "iam";
  return "none";
}

function getClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: ENV.bedrockRegion,
      credentials: {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
        ...(ENV.awsSessionToken ? { sessionToken: ENV.awsSessionToken } : {}),
      },
    });
  }
  return client;
}

export function isBedrockConfigured(): boolean {
  return Boolean(ENV.bedrockModelId && ENV.bedrockRegion && getBedrockAuthMode() !== "none");
}

function toContentBlock(text: string): ContentBlock {
  return { text };
}

function toBedrockMessage(message: BedrockChatMessage): BedrockMessage {
  return { role: message.role, content: [toContentBlock(message.content)] };
}

function extractText(content: Array<{ text?: unknown }> | undefined): string {
  return (content ?? [])
    .flatMap((block) => (typeof block.text === "string" ? [block.text] : []))
    .join("\n")
    .trim();
}

function getBearerEndpoint(): string {
  const modelId = encodeURIComponent(ENV.bedrockModelId);
  return `https://bedrock-runtime.${ENV.bedrockRegion}.amazonaws.com/model/${modelId}/converse`;
}

async function invokeWithBearerToken(request: BedrockGatewayRequest): Promise<BedrockGatewayResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.bedrockTimeoutMs);

  try {
    const response = await fetch(getBearerEndpoint(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.bedrockApiKey}`,
      },
      body: JSON.stringify({
        system: [{ text: request.system }],
        messages: request.messages.map(toBedrockMessage),
        inferenceConfig: {
          maxTokens: request.maxTokens ?? ENV.bedrockMaxTokens,
          temperature: request.temperature ?? ENV.bedrockTemperature,
          topP: request.topP ?? ENV.bedrockTopP,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Amazon Bedrock bearer request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      output?: { message?: { content?: Array<{ text?: unknown }> } };
      stopReason?: string;
      usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    };
    const content = extractText(payload.output?.message?.content);
    if (!content) throw new Error("Amazon Bedrock returned an empty response.");

    return {
      content,
      modelId: ENV.bedrockModelId,
      stopReason: payload.stopReason,
      usage: payload.usage,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Amazon Bedrock request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function invokeWithIam(request: BedrockGatewayRequest): Promise<BedrockGatewayResponse> {
  const command = new ConverseCommand({
    modelId: ENV.bedrockModelId,
    system: [{ text: request.system }],
    messages: request.messages.map(toBedrockMessage),
    inferenceConfig: {
      maxTokens: request.maxTokens ?? ENV.bedrockMaxTokens,
      temperature: request.temperature ?? ENV.bedrockTemperature,
      topP: request.topP ?? ENV.bedrockTopP,
    },
  });

  const response = await Promise.race([
    getClient().send(command),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Amazon Bedrock request timed out.")), ENV.bedrockTimeoutMs);
    }),
  ]);
  const content = extractText(response.output?.message?.content);
  if (!content) throw new Error("Amazon Bedrock returned an empty response.");

  return {
    content,
    modelId: ENV.bedrockModelId,
    stopReason: response.stopReason,
    usage: response.usage,
  };
}

export async function invokeBedrock(request: BedrockGatewayRequest): Promise<BedrockGatewayResponse> {
  if (!isBedrockConfigured()) {
    throw new Error("Amazon Bedrock is not configured. Set BEDROCK_REGION, BEDROCK_MODEL_ID, and either BEDROCK_API_KEY or AWS IAM credentials.");
  }

  return getBedrockAuthMode() === "bearer"
    ? invokeWithBearerToken(request)
    : invokeWithIam(request);
}

export function resetBedrockClientForTests(): void {
  client = null;
}
