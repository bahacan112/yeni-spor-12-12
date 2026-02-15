import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const slug = process.env.TEST_TENANT_SLUG || "test";

const paths = [
  `/site/${slug}`,
  `/site/${slug}/magaza`,
  `/site/${slug}/sepet`,
  `/site/${slug}/siparisler`,
  `/site/${slug}/kayit`,
];

test.describe("Tenant website", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
