import React from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMediaQuery } from "../useMediaQuery";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

it("keeps the server snapshot stable during mobile hydration", async () => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  function Subject() {
    const mobile = useMediaQuery("(max-width: 767.98px)");
    return <span>{mobile ? "Mobile" : "Desktop"}</span>;
  }

  const container = document.createElement("div");
  container.innerHTML = renderToString(<Subject />);
  document.body.appendChild(container);
  expect(container).toHaveTextContent("Desktop");

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <Subject />);
  });

  await waitFor(() => expect(container).toHaveTextContent("Mobile"));
  expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("hydration"));

  await act(async () => root.unmount());
});
