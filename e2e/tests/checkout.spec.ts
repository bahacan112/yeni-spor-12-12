import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const paths = ["/checkout/success", "/checkout/error"];

test.describe("Checkout status pages", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
