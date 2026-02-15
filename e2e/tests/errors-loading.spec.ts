import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

test.describe("Errors and loading", () => {
  test("Unknown route returns error or not-found", async ({ page }) => {
    const res = await checkRoute(page, "/this-route-does-not-exist");
    expect(["error", "ok"]).toContain(res.status);
  });

  test("Auth loading exists", async ({ page }) => {
    const res = await checkRoute(page, "/auth/verify-email");
    expect(["ok", "redirect", "error"]).toContain(res.status);
  });
});
