import React, { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearApiResourceCache, useApiResource } from "../useApiResource";

describe("useApiResource", () => {
  beforeEach(() => clearApiResourceCache());

  it("deduplicates Strict Mode subscriptions into one request", async () => {
    const fetcher = vi.fn().mockResolvedValue({ message: "Loaded" });

    function Subject() {
      const resource = useApiResource<{ message: string }>("strict-mode-share", fetcher);
      return <div>{resource.data?.message || resource.status}</div>;
    }

    render(
      <StrictMode>
        <Subject />
      </StrictMode>,
    );

    await waitFor(() => expect(screen.getByText("Loaded")).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
