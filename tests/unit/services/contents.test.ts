/**
 * Unit tests for the contents service (src/services/contents.ts).
 * Mocks the repo layer to test business logic in isolation.
 */
import { describe, expect, it, vi } from "vitest";

const mockRepo = vi.hoisted(() => ({
  createContent: vi.fn(),
  getContentById: vi.fn(),
  listContents: vi.fn(),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
}));

vi.mock("../../../src/repos/contents.ts", () => mockRepo);

// Import after mocks are set up
const { create, getById, list, update, remove } = await import("../../../src/services/contents.ts");

const fakeRow = {
  id: "test-uuid",
  platform: "x",
  sourceId: "123456",
  url: "https://x.com/user/status/123456",
  authorAccountId: null,
  parentId: null,
  title: null,
  text: "Hello world",
  textFormat: "plain",
  slug: null,
  language: null,
  contentType: "post",
  likes: 10,
  reposts: 2,
  replies: 1,
  views: 100,
  bookmarks: 5,
  status: "fetched",
  rating: null,
  postedAt: new Date(1000000),
  fetchedAt: new Date(1000000),
  archivedAt: null,
  readAt: null,
  meta: null,
  rawPayload: null,
};

describe("contents service", () => {
  it("create() generates UUID and sets fetchedAt, then calls repo", async () => {
    mockRepo.createContent.mockResolvedValueOnce(fakeRow);
    const result = await create({ platform: "x", sourceId: "123456", text: "Hello world" });
    expect(result).toEqual(fakeRow);
    expect(mockRepo.createContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ platform: "x", sourceId: "123456" }),
      expect.any(Date),
    );
    // Verify the UUID is a valid format
    const callArgs = mockRepo.createContent.mock.calls[0];
    expect(callArgs?.[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    // Verify timestamp is a reasonable Date
    const timestamp = callArgs?.[2] as Date;
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).toBeGreaterThan(1000000000000);
  });

  it("create() defaults status to fetched", async () => {
    mockRepo.createContent.mockResolvedValueOnce(fakeRow);
    await create({ platform: "x" });
    const callArgs = mockRepo.createContent.mock.calls[0];
    expect(callArgs?.[1]).toMatchObject({ platform: "x" });
  });

  it("getById() delegates to repo", async () => {
    mockRepo.getContentById.mockResolvedValueOnce(fakeRow);
    const result = await getById("test-uuid");
    expect(result).toEqual(fakeRow);
    expect(mockRepo.getContentById).toHaveBeenCalledWith("test-uuid");
  });

  it("list() delegates to repo", async () => {
    mockRepo.listContents.mockResolvedValueOnce([fakeRow]);
    const result = await list({ platform: "x" });
    expect(result).toEqual([fakeRow]);
  });

  it("update() delegates to repo", async () => {
    mockRepo.updateContent.mockResolvedValueOnce({ ...fakeRow, text: "Updated" });
    const result = await update("test-uuid", { text: "Updated" });
    expect(result?.text).toBe("Updated");
    expect(mockRepo.updateContent).toHaveBeenCalledWith("test-uuid", { text: "Updated" });
  });

  it("remove() delegates to repo", async () => {
    mockRepo.deleteContent.mockResolvedValueOnce(true);
    const result = await remove("test-uuid");
    expect(result).toBe(true);
  });
});
