import { describe, expect, it } from "vitest";
import { extractLocalizedPrices } from "../useLocalizedBillingPrices";

describe("extractLocalizedPrices", () => {
  it("maps Paddle formatted line-item totals by price ID", () => {
    expect(extractLocalizedPrices({
      data: {
        details: {
          lineItems: [
            { price: { id: "pri_solo_monthly" }, formattedTotals: { total: "$8.00" } },
            { price: { id: "pri_solo_annual" }, formattedTotals: { total: "₦12,000.00" } },
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
      data: { details: { lineItems: [{ price: { id: "pri_missing_total" } }, { formattedTotals: { total: "$1.00" } }] } },
    })).toEqual({});
  });
});
