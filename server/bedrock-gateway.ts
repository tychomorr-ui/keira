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

let client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: ENV.bedrockRegion,
      credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
        ? {
            accessKeyId: ENV.awsAccessKeyId,
            secretAccessKey: ENV.awsSecretAccessKey,
            ...(ENV.awsSessionToken ? { sessionToken: ENV.awsSessionToken } : {}),
          }
        : undefined,
    });
  }
  return client;
}

export function isBedrockConfigured(): boolean {
  return Boolean(ENV.bedrockModelId && ENV.bedrockRegion && ENV.awsAccessKeyId && ENV.awsSecretAccessKey);
}

function toContentBlock(text: string): ContentBlock {
  return { text };
}

function toBedrockMessage(message: BedrockChatMessage): BedrockMessage {
  return {
    role: message.role,
    content: [toContentBlock(message.content)],
  };
}

function extractText(content: ContentBlock[] | undefined): string {
  return (content ?? [])
    .flatMap((block) => ("text" in block && typeof block.text === "string" ? [block.text] : []))
    .join("\n")
    .trim();
}

export async function invokeBedrock(request: BedrockGatewayRequest): Promise<BedrockGatewayResponse> {
  if (!isBedrockConfigured()) {
    throw new Error("Amazon Bedrock is not configured. Set AWS credentials, BEDROCK_REGION, and BEDROCK_MODEL_ID.");
  }

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
    usage: response.usage
      ? {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens,
        }
      : undefined,
  };
}

export function resetBedrockClientForTests(): void {
  client = null;
}
