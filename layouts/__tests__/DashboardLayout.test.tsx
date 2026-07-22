import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "../../app/(dashboard)/layout";

let mobileViewport = true;

vi.mock("/hooks/useMediaQuery", () => ({
  useMediaQuery: () => mobileViewport,
}));

vi.mock("../../components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("/layouts/navbars/NavbarTop", () => ({
  default: ({ buttonRef, navigationVisible, onToggle }: {
    buttonRef: React.Ref<HTMLButtonElement>;
    navigationVisible: boolean;
    onToggle: () => void;
  }) => (
    <button
      ref={buttonRef}
      type="button"
      aria-label={navigationVisible ? "Close dashboard navigation" : "Open dashboard navigation"}
      aria-expanded={navigationVisible}
      onClick={onToggle}
    >
      Menu
    </button>
  ),
}));

vi.mock("/layouts/navbars/NavbarVertical", () => ({
  default: ({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) => (
    <>
      <button type="button" onClick={onClose}>Close menu</button>
      <button type="button" onClick={onNavigate}>Go to shares</button>
    </>
  ),
}));

describe("DashboardLayout navigation", () => {
  beforeEach(() => {
    mobileViewport = true;
    document.body.style.overflow = "";
  });

  it("opens an accessible mobile drawer and closes it with Escape", async () => {
    render(<DashboardLayout><button type="button">Page action</button></DashboardLayout>);

    const toggle = screen.getByRole("button", { name: "Open dashboard navigation" });
    const navigation = document.querySelector("#dashboard-navigation");
    expect(navigation).not.toBeNull();
    expect(navigation).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(toggle);

    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));
    expect(navigation).toHaveAttribute("aria-hidden", "false");
    expect(navigation).toHaveFocus();
    expect(document.querySelector("#page-content")).toHaveAttribute("inert");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(navigation).toHaveAttribute("aria-hidden", "true"));
    expect(toggle).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores focus after a mobile navigation link closes the drawer", async () => {
    render(<DashboardLayout><div>Shares page</div></DashboardLayout>);

    const toggle = screen.getByRole("button", { name: "Open dashboard navigation" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Go to shares" }));

    await waitFor(() => expect(toggle).toHaveFocus());
    expect(document.querySelector("#dashboard-navigation")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector("#page-content")).not.toHaveAttribute("inert");
  });

  it("keeps the desktop sidebar visible until the user collapses it", () => {
    mobileViewport = false;
    render(<DashboardLayout><div>Dashboard content</div></DashboardLayout>);

    const toggle = screen.getByRole("button", { name: "Close dashboard navigation" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Open dashboard navigation" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.querySelector("#db-wrapper")).toHaveClass("desktop-sidebar-collapsed");
  });
});
