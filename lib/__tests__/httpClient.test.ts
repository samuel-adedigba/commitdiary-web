import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({ default: vi.fn() }));

describe("httpRequest credentials", () => {
  beforeEach(() => {
    vi.mocked(axios).mockReset();
    vi.mocked(axios).mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      data: {},
    });
  });

  it("includes same-origin credentials by default for HttpOnly sessions", async () => {
    const { httpRequest } = await import("../httpClient");

    await httpRequest("/api/auth/user");

    expect(axios).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: true }));
  });

  it("honors an explicit credential omission", async () => {
    const { httpRequest } = await import("../httpClient");

    await httpRequest("/public", { credentials: "omit" });

    expect(axios).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: false }));
  });
});
