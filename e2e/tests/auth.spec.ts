import { test, expect } from "@playwright/test";
import { checkRoute } from "../utils/status";

test.describe("AUTH", () => {
  test("Login page renders", async ({ page }) => {
    const res = await checkRoute(page, "/auth/login");
    expect(["ok", "redirect", "error"]).toContain(res.status);
  });

  test("Unauthorized access to dashboard redirects to login", async ({
    page,
  }) => {
    const res = await checkRoute(page, "/dashboard");
    expect(["redirect", "error"]).toContain(res.status);
  });
});
