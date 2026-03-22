import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.ts";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateText(
  prompt: string,
  options?: { maxTokens?: number },
): Promise<string> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: options?.maxTokens ?? 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block?.type === "text") {
    return block.text;
  }
  return "";
}
