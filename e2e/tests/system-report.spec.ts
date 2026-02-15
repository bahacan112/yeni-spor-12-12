import { test } from "@playwright/test";
import { checkRoute } from "../utils/status";
import fs from "fs";
import path from "path";

const modulePaths = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Applications", path: "/dashboard/applications" },
  { name: "Trainings", path: "/dashboard/trainings" },
  { name: "Attendance", path: "/dashboard/attendance" },
  { name: "Calendar", path: "/dashboard/calendar" },
  { name: "Reports", path: "/dashboard/reports" },
  { name: "Accounting", path: "/dashboard/accounting" },
];

test("Collect modules status for system report", async ({ page }) => {
  const results: Array<{
    name: string;
    status: "ok" | "redirect" | "error";
    ttfbMs: number;
  }> = [];
  for (const m of modulePaths) {
    const r = await checkRoute(page, m.path);
    results.push({ name: m.name, status: r.status, ttfbMs: r.ttfbMs });
  }
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "modules.json"),
    JSON.stringify(results, null, 2)
  );
});
