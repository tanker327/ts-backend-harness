/**
 * Unit tests for the BullMQ worker job handlers (src/services/worker.ts).
 * Mocks the repo layer to test business logic in isolation.
 */
import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockContentRepo = vi.hoisted(() => ({
  createContent: vi.fn(),
  getContentById: vi.fn(),
  listContents: vi.fn(),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
}));

vi.mock("../../../src/repos/contents.ts", () => mockContentRepo);

const { generateTitleFromText, processJob } = await import("../../../src/services/worker.ts");

/** Helper to create a minimal Job-like object for processJob. */
function fakeJob(type: string, payload?: Record<string, unknown>) {
  return { data: { type, payload } } as Job<{ type: string; payload?: Record<string, unknown> }>;
}

describe("generateTitleFromText", () => {
  it("truncates to 8 words with ellipsis when text exceeds 8 words", () => {
    const text = "The quick brown fox jumps over the lazy dog today";
    expect(generateTitleFromText(text)).toBe("The quick brown fox jumps over the lazy...");
  });

  it("returns full text when 8 words or fewer", () => {
    expect(generateTitleFromText("Hello world")).toBe("Hello world");
  });

  it("returns full text for exactly 8 words without ellipsis", () => {
    const text = "one two three four five six seven eight";
    expect(generateTitleFromText(text)).toBe(text);
  });

  it("adds ellipsis for exactly 9 words", () => {
    const text = "one two three four five six seven eight nine";
    expect(generateTitleFromText(text)).toBe("one two three four five six seven eight...");
  });

  it("normalizes extra whitespace", () => {
    expect(generateTitleFromText("  hello   world   foo  ")).toBe("hello world foo");
  });

  it("respects custom maxWords parameter", () => {
    expect(generateTitleFromText("one two three four five", 3)).toBe("one two three...");
  });

  it("handles single word", () => {
    expect(generateTitleFromText("hello")).toBe("hello");
  });
});

describe("processJob: generate-title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when contentId is missing", async () => {
    const result = await processJob(fakeJob("generate-title"));
    expect(result).toEqual({
      ok: false,
      message: "missing contentId in payload",
    });
  });

  it("returns error when content is not found", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce(null);
    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));
    expect(result).toEqual({ ok: false, message: "content not found: abc" });
  });

  it("skips when title already exists", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce({
      id: "abc",
      title: "Existing Title",
      text: "some text",
    });
    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));
    expect(result).toEqual({
      ok: true,
      message: "title already exists, skipping",
    });
    expect(mockContentRepo.updateContent).not.toHaveBeenCalled();
  });

  it("returns error when text is null", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce({
      id: "abc",
      title: null,
      text: null,
    });
    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));
    expect(result).toEqual({
      ok: false,
      message: "content has no text to generate title from",
    });
  });

  it("returns error when text is empty", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce({
      id: "abc",
      title: null,
      text: "   ",
    });
    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));
    expect(result).toEqual({
      ok: false,
      message: "content has no text to generate title from",
    });
  });

  it("generates title from first 8 words and saves to db", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce({
      id: "abc",
      title: null,
      text: "The quick brown fox jumps over the lazy dog today",
    });
    mockContentRepo.updateContent.mockResolvedValueOnce({});

    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));

    expect(result).toEqual({
      ok: true,
      message: "title generated: The quick brown fox jumps over the lazy...",
    });
    expect(mockContentRepo.updateContent).toHaveBeenCalledWith("abc", {
      title: "The quick brown fox jumps over the lazy...",
    });
  });

  it("uses full text as title when 8 words or fewer", async () => {
    mockContentRepo.getContentById.mockResolvedValueOnce({
      id: "abc",
      title: null,
      text: "Short text here",
    });
    mockContentRepo.updateContent.mockResolvedValueOnce({});

    const result = await processJob(fakeJob("generate-title", { contentId: "abc" }));

    expect(result).toEqual({
      ok: true,
      message: "title generated: Short text here",
    });
    expect(mockContentRepo.updateContent).toHaveBeenCalledWith("abc", {
      title: "Short text here",
    });
  });
});
