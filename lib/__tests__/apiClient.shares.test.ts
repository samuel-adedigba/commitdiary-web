import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({ default: vi.fn() }));

const sharePayload = {
  title: "Weekly work",
  username: "blaze",
  scope: {},
  repositories: [],
  selected_repo: null,
  repos: [],
  total_commits: 0,
  total_repos: 0,
  page: 1,
  limit: 20,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  },
};

describe("share API client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.mocked(axios).mockReset();
  });

  it("deduplicates identical in-flight public share requests", async () => {
    const axiosMock = vi.mocked(axios).mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      data: sharePayload,
    });
    const { getPublicShare } = await import("../apiClient");

    const [first, second] = await Promise.all([
      getPublicShare("blaze", "abcdef123456", { page: 1, limit: 20 }),
      getPublicShare("blaze", "abcdef123456", { page: 1, limit: 20 }),
    ]);

    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(sharePayload);
    expect(second).toEqual(sharePayload);
  });

  it("uses the safe API error message returned by the server", async () => {
    vi.mocked(axios).mockResolvedValue({
      status: 410,
      statusText: "Gone",
      headers: {},
      data: {
        error: "Share has expired",
        code: "SHARE_EXPIRED",
      },
    });
    const { getPublicShare } = await import("../apiClient");

    await expect(
      getPublicShare("blaze", "abcdef123456", { page: 2, limit: 20 }),
    ).rejects.toMatchObject({
      message: "Share has expired",
      status: 410,
      code: "SHARE_EXPIRED",
    });
  });
});
