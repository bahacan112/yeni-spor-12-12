import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { checkRoute } from "../utils/status";

function mapLinkToKey(link: string): string | null {
  if (link.includes("/dashboard/branches")) return "branches";
  if (link.includes("/dashboard/instructors")) return "instructors";
  if (link.includes("/dashboard/sports")) return "sports";
  if (link.includes("/dashboard/groups")) return "groups";
  if (link.includes("/dashboard/venues")) return "venues";
  if (link.includes("/dashboard/students")) return "students";
  if (link.includes("/dashboard/trainings")) return "trainings";
  return null;
}

test("Setup status from /dashboard/setup", async ({ page }) => {
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });

  // First, check route status. If not 'ok', write default and return.
  const route = await checkRoute(page, "/dashboard/setup");
  if (route.status !== "ok") {
    const fallback = {
      status: "Başlanmadı",
      currentStepIndex: 0,
      steps: [
        { key: "branches", completed: false, count: 0 },
        { key: "instructors", completed: false, count: 0 },
        { key: "sports", completed: false, count: 0 },
        { key: "groups", completed: false, count: 0 },
        { key: "venues", completed: false, count: 0 },
        { key: "students", completed: false, count: 0 },
        { key: "trainings", completed: false, count: 0 },
      ],
    };
    fs.writeFileSync(
      path.join(outDir, "setup.json"),
      JSON.stringify(fallback, null, 2)
    );
    return;
  }

  // On success, parse DOM
  const items = page.locator("ul.divide-y > li");
  const count = await items.count();
  const steps: Array<{ key: string; completed: boolean; count: number }> = [];
  let currentIndex = -1;

  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const title =
      (await item.locator(".font-medium").textContent())?.trim() || "";
    const countText =
      (await item.locator(".text-xs.text-muted-foreground").textContent()) ||
      "";
    const numMatch = countText.match(/(\d+)/);
    const num = numMatch ? Number(numMatch[1]) : 0;
    const linkHref = await item.locator("a[href]").getAttribute("href");
    const circleClass =
      (await item.locator("div.rounded-full").getAttribute("class")) || "";
    const completed = circleClass.includes("bg-green-500");
    const isCurrent = circleClass.includes("bg-yellow-500");
    if (isCurrent) currentIndex = i;
    const key = linkHref ? mapLinkToKey(linkHref) : null;
    steps.push({
      key:
        key || title.toLowerCase().includes("şube")
          ? "branches"
          : title.toLowerCase().includes("eğitmen")
          ? "instructors"
          : title.toLowerCase().includes("branş")
          ? "sports"
          : title.toLowerCase().includes("grup")
          ? "groups"
          : title.toLowerCase().includes("saha")
          ? "venues"
          : title.toLowerCase().includes("öğrenci")
          ? "students"
          : title.toLowerCase().includes("antrenman")
          ? "trainings"
          : `unknown-${i}`,
      completed,
      count: num,
    });
  }

  if (currentIndex === -1) {
    currentIndex = steps.findIndex((s) => !s.completed);
  }

  const isComplete = steps.every((s) => s.completed);
  const allIncomplete = steps.every((s) => !s.completed);
  const status = isComplete
    ? "Tamamlandı"
    : allIncomplete
    ? "Başlanmadı"
    : "Devam Ediyor";

  const payload = {
    status,
    currentStepIndex: currentIndex < 0 ? 0 : currentIndex,
    steps,
  };
  fs.writeFileSync(
    path.join(outDir, "setup.json"),
    JSON.stringify(payload, null, 2)
  );
});
