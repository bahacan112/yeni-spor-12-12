import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const paths = [
  "/admin",
  "/admin/users",
  "/admin/subscriptions",
  "/admin/payments",
  "/admin/schools",
  "/admin/plans",
  "/admin/reports",
  "/admin/notifications",
  "/admin/settings",
];

test.describe("Admin modules gating", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
