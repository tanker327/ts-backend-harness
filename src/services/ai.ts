/**
 * AI service. Orchestrates AI-backed features by delegating to the Anthropic
 * provider wrapper (ADR-022) — never imports the vendor SDK directly.
 */
import * as anthropic from "../providers/anthropic.ts";

/** Send a prompt to Claude and return the text response. */
export async function generateText(
  prompt: string,
  options?: { maxTokens?: number },
): Promise<string> {
  return anthropic.generateText(prompt, options);
}
