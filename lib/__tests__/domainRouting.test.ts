import { describe, expect, it } from "vitest";
import { resolveDomainRoute } from "../domainRouting";

const config = {
  marketingUrl: "https://www.example.test",
  appUrl: "https://app.example.test",
};

describe("resolveDomainRoute", () => {
  it("rewrites the app root to the dashboard", () => {
    expect(resolveDomainRoute(new URL("https://app.example.test/"), "app.example.test", config)).toEqual({
      action: "rewrite",
      pathname: "/dashboard",
    });
  });

  it("moves product routes from marketing to the app origin", () => {
    const route = resolveDomainRoute(
      new URL("https://www.example.test/commits?period=week"),
      "www.example.test",
      config,
    );

    expect(route.action).toBe("redirect");
    if (route.action === "redirect") {
      expect(route.url.toString()).toBe("https://app.example.test/commits?period=week");
    }
  });

  it("routes nested product settings to the app origin", () => {
    const route = resolveDomainRoute(
      new URL("https://www.example.test/pages/settings"),
      "www.example.test",
      config,
    );

    expect(route.action).toBe("redirect");
  });

  it("moves marketing routes from the app to the marketing origin", () => {
    const route = resolveDomainRoute(
      new URL("https://app.example.test/pricing"),
      "app.example.test",
      config,
    );

    expect(route.action).toBe("redirect");
    if (route.action === "redirect") {
      expect(route.url.toString()).toBe("https://www.example.test/pricing");
    }
  });

  it("keeps the Marketplace redirect route on the app origin", () => {
    expect(
      resolveDomainRoute(
        new URL("https://app.example.test/marketplace"),
        "app.example.test",
        config,
      ),
    ).toEqual({ action: "next" });
  });

  it("keeps path-based local development when origins are absent", () => {
    expect(
      resolveDomainRoute(new URL("http://localhost:3000/"), "localhost:3000", {
        marketingUrl: "",
        appUrl: "",
      }),
    ).toEqual({ action: "next" });
  });

  it("does not route unrecognized preview hosts", () => {
    expect(resolveDomainRoute(new URL("https://preview.example.test/"), "preview.example.test", config)).toEqual({
      action: "next",
    });
  });
});
