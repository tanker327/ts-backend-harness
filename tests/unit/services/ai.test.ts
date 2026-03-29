/**
 * Unit tests for the AI service (src/services/ai.ts).
 * Mocks the Anthropic SDK to avoid real API calls.
 */
import { describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

vi.mock("../../../src/config/env.ts", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
    DATABASE_URL: "file:./data/test.db",
    DATABASE_AUTH_TOKEN: "",
    JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
    BETTER_AUTH_SECRET: "test-auth-secret-at-least-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:3000",
    NODE_ENV: "test",
    PORT: 3000,
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
  },
}));

import { generateText } from "../../../src/services/ai.ts";

describe("AI service — generateText", () => {
  it("returns text from Claude response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Hello world" }],
    });

    const result = await generateText("Say hello");
    expect(result).toBe("Hello world");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Say hello" }],
      }),
    );
  });

  it("respects custom maxTokens option", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Short" }],
    });

    await generateText("Be brief", { maxTokens: 100 });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 100 }));
  });

  it("returns empty string for non-text responses", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "1", name: "test", input: {} }],
    });

    const result = await generateText("Use a tool");
    expect(result).toBe("");
  });
});
