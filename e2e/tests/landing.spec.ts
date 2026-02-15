import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const paths = ["/", "/pricing", "/about", "/features"];

test.describe("Landing pages", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
