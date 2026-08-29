import { describe, expect, it } from "vitest";
import { extractLocalizedPrices } from "../useLocalizedBillingPrices";

describe("extractLocalizedPrices", () => {
  it("maps Paddle formatted line-item subtotals by price ID", () => {
    expect(extractLocalizedPrices({
      data: {
        details: {
          lineItems: [
            { price: { id: "pri_solo_monthly" }, formattedTotals: { subtotal: "$8.00" } },
            { price: { id: "pri_solo_annual" }, formattedTotals: { subtotal: "₦12,000.00" } },
          ],
        },
      },
    })).toEqual({
      pri_solo_monthly: "$8.00",
      pri_solo_annual: "₦12,000.00",
    });
  });

  it("ignores incomplete line items", () => {
    expect(extractLocalizedPrices({
      data: { details: { lineItems: [{ price: { id: "pri_missing_total" } }, { formattedTotals: { subtotal: "$1.00" } }] } },
    })).toEqual({});
  });
});
