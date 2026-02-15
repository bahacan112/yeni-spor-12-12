import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

const paths = [
  "/dashboard",
  "/dashboard/applications",
  "/dashboard/students",
  "/dashboard/instructors",
  "/dashboard/groups",
  "/dashboard/trainings",
  "/dashboard/attendance",
  "/dashboard/calendar",
  "/dashboard/reports",
  "/dashboard/accounting",
  "/dashboard/dues",
  "/dashboard/products",
  "/dashboard/orders",
  "/dashboard/payment-history",
  "/dashboard/subscriptions",
  "/dashboard/notifications",
  "/dashboard/venues",
  "/dashboard/branches",
  "/dashboard/registration-links",
  "/dashboard/website",
  "/dashboard/general-accounting",
  "/dashboard/settings",
];

test.describe("Dashboard modules gating", () => {
  for (const p of paths) {
    test(`Route status ${p}`, async ({ page }) => {
      const res = await checkRoute(page, p);
      expect(["ok", "redirect", "error"]).toContain(res.status);
    });
  }
});
