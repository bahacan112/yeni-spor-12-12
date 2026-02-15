import { Page } from "@playwright/test";

export type ModuleStatus = "ok" | "redirect" | "error";

export async function checkRoute(page: Page, path: string) {
  const start = Date.now();
  let status: ModuleStatus = "ok";
  let url = "";
  try {
    const response = await page.goto(
      `${process.env.BASE_URL || "http://localhost:3000"}${path}`,
      {
        waitUntil: "domcontentloaded",
      }
    );
    url = page.url();
    if (url.includes("/auth/login") || url.includes("/dashboard/setup")) {
      status = "redirect";
    } else if (response && response.status() >= 400) {
      status = "error";
    } else {
      status = "ok";
    }
  } catch {
    status = "error";
    url = page.url();
  }
  const ttfbMs = Date.now() - start;
  return { name: path, status, ttfbMs, url };
}
