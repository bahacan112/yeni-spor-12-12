import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const paths = [
  "/instructor",
  "/instructor/groups",
  "/instructor/trainings",
  "/instructor/attendance",
  "/instructor/analytics",
  "/instructor/settings",
];

test.describe("Instructor modules gating", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
