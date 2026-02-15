const fs = require("fs");
const path = require("path");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function collectTestsFromSuite(suite, acc) {
  if (!suite) return;
  if (Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      for (const t of spec.tests || []) {
        const status =
          t.status === "expected" || t.status === "passed"
            ? "passed"
            : "failed";
        const durationMs = (t.results || []).reduce(
          (sum, r) => sum + (r.duration || 0),
          0
        );
        acc.tests.push({ name: spec.title, status, durationMs });
        if (status === "passed") acc.summary.passed++;
        else acc.summary.failed++;
        acc.summary.total++;
        acc.summary.durationMs += durationMs;
      }
    }
  }
  if (Array.isArray(suite.suites)) {
    for (const s of suite.suites) collectTestsFromSuite(s, acc);
  }
}

function main() {
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const raw = readJson(path.join(outDir, "raw.json")) || {};
  const modules = readJson(path.join(outDir, "modules.json")) || [];
  const setup = readJson(path.join(outDir, "setup.json")) || null;

  const result = {
    runAt: new Date().toISOString(),
    environment: {
      baseURL: "http://localhost:3000",
      browser: "chromium",
      headless: true,
    },
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      durationMs: 0,
    },
    setupStatus: setup
      ? {
          status: setup.status || "Başlanmadı",
          currentStepIndex:
            typeof setup.currentStepIndex === "number"
              ? setup.currentStepIndex
              : 0,
          steps: Array.isArray(setup.steps)
            ? setup.steps
            : [
                { key: "branches", completed: false, count: 0 },
                { key: "instructors", completed: false, count: 0 },
                { key: "sports", completed: false, count: 0 },
                { key: "groups", completed: false, count: 0 },
                { key: "venues", completed: false, count: 0 },
                { key: "students", completed: false, count: 0 },
                { key: "trainings", completed: false, count: 0 },
              ],
        }
      : {
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
        },
    modules: modules.map((m) => ({
      name: m.name,
      status: m.status,
      ttfbMs: m.ttfbMs || 0,
    })),
    checks: [],
    tests: [],
    errors: [],
  };

  // Collect test results from Playwright raw JSON
  if (Array.isArray(raw.suites)) {
    for (const suite of raw.suites) {
      collectTestsFromSuite(suite, result);
    }
  }

  // Save last-run.json in custom schema
  fs.writeFileSync(
    path.join(outDir, "last-run.json"),
    JSON.stringify(result, null, 2)
  );
  console.log("Wrote", path.join(outDir, "last-run.json"));
}

main();
