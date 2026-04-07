/**
 * Unit tests for the author accounts service (src/services/author-accounts.ts).
 * Mocks the repo layer to test business logic in isolation.
 */
import { describe, expect, it, vi } from "vitest";

const mockRepo = vi.hoisted(() => ({
  createAuthorAccount: vi.fn(),
  getAuthorAccountById: vi.fn(),
  getAuthorAccountByPlatformId: vi.fn(),
  listAuthorAccounts: vi.fn(),
  updateAuthorAccount: vi.fn(),
  deleteAuthorAccount: vi.fn(),
}));

vi.mock("../../../src/repos/author-accounts.ts", () => mockRepo);

// Import after mocks are set up
const { create, getById, getByPlatformId, list, update, remove } = await import(
  "../../../src/services/author-accounts.ts"
);

const fakeRow = {
  id: "test-uuid",
  platform: "youtube",
  accountId: "UC1234",
  accountUrl: null,
  handle: "@Test",
  name: "Test Creator",
  description: null,
  avatarUrl: null,
  followers: null,
  isVerified: false,
  meta: null,
  createdAt: new Date(1000000),
  updatedAt: new Date(1000000),
};

describe("author-accounts service", () => {
  it("create() generates UUID and timestamps, then calls repo", async () => {
    mockRepo.createAuthorAccount.mockResolvedValueOnce(fakeRow);
    const result = await create({ platform: "youtube", accountId: "UC1234", name: "Test Creator" });
    expect(result).toEqual(fakeRow);
    expect(mockRepo.createAuthorAccount).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ platform: "youtube", accountId: "UC1234" }),
      expect.any(Date),
    );
  });

  it("getById() delegates to repo", async () => {
    mockRepo.getAuthorAccountById.mockResolvedValueOnce(fakeRow);
    const result = await getById("test-uuid");
    expect(result).toEqual(fakeRow);
    expect(mockRepo.getAuthorAccountById).toHaveBeenCalledWith("test-uuid");
  });

  it("getByPlatformId() delegates to repo", async () => {
    mockRepo.getAuthorAccountByPlatformId.mockResolvedValueOnce(fakeRow);
    const result = await getByPlatformId("youtube", "UC1234");
    expect(result).toEqual(fakeRow);
  });

  it("list() delegates to repo", async () => {
    mockRepo.listAuthorAccounts.mockResolvedValueOnce([fakeRow]);
    const result = await list({ platform: "youtube" });
    expect(result).toEqual([fakeRow]);
  });

  it("update() sets updatedAt and delegates to repo", async () => {
    mockRepo.updateAuthorAccount.mockResolvedValueOnce({ ...fakeRow, name: "Updated" });
    const result = await update("test-uuid", { name: "Updated" });
    expect(result?.name).toBe("Updated");
    expect(mockRepo.updateAuthorAccount).toHaveBeenCalledWith(
      "test-uuid",
      { name: "Updated" },
      expect.any(Date),
    );
  });

  it("remove() delegates to repo", async () => {
    mockRepo.deleteAuthorAccount.mockResolvedValueOnce(true);
    const result = await remove("test-uuid");
    expect(result).toBe(true);
  });
});
