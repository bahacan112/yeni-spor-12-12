const fs = require("fs");
const path = require("path");

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function listFiles(dir, exts = [".ts", ".tsx", ".js", ".sql"], ignore = []) {
  const res = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      const rel = full.replace(process.cwd(), "");
      if (ignore.some((ig) => rel.includes(ig))) continue;
      if (e.isDirectory()) {
        stack.push(full);
      } else {
        if (exts.includes(path.extname(e.name))) {
          res.push(full);
        }
      }
    }
  }
  return res;
}

function extractTablesFromSql(sql) {
  const tables = {};
  const createRe =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\)\s*;/gi;
  let m;
  while ((m = createRe.exec(sql)) !== null) {
    const tname = m[1];
    const body = m[2];
    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const cols = [];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.startsWith("constraint") ||
        lower.startsWith("primary key") ||
        lower.startsWith("foreign key") ||
        lower.startsWith("unique") ||
        lower.startsWith("check") ||
        lower.startsWith("exclude")
      ) {
        continue;
      }
      const nameMatch = /^"?(?<name>[a-zA-Z0-9_]+)"?\s+/.exec(line);
      if (nameMatch && nameMatch.groups && nameMatch.groups.name) {
        cols.push(nameMatch.groups.name);
      }
    }
    if (!tables[tname]) tables[tname] = new Set();
    cols.forEach((c) => tables[tname].add(c));
  }
  return tables;
}

function mergeTableSets(a, b) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    out[k] = new Set([...(a[k] || []), ...(b[k] || [])]);
  }
  return out;
}

function scanUsage(files, tables) {
  const usage = {};
  for (const t of Object.keys(tables)) {
    usage[t] = {};
    for (const c of tables[t]) {
      usage[t][c] = { count: 0, examples: [] };
    }
  }
  for (const f of files) {
    const content = readFileSafe(f);
    if (!content) continue;
    for (const t of Object.keys(tables)) {
      for (const c of tables[t]) {
        // heuristic: dot access, bracket access, query builder usage
        const patterns = [
          new RegExp("\\." + c + "\\b", "g"),
          new RegExp("\\[\\s*['\\\"]" + c + "['\\\"]\\s*\\]", "g"),
          new RegExp("select\\(.*\\b" + c + "\\b.*\\)", "gis"),
          new RegExp("\\b(eq|neq|gt|lt|gte|lte|order|in|is)\\(\\s*['\\\"]" + c + "['\\\"]", "g"),
          new RegExp("\\b" + c + "\\b", "g"), // last resort plain token
        ];
        let matched = false;
        for (const re of patterns) {
          const m = content.match(re);
          if (m && m.length) {
            usage[t][c].count += m.length;
            if (!matched) {
              usage[t][c].examples.push(f);
              matched = true;
            }
          }
        }
      }
    }
  }
  return usage;
}

function main() {
  const repoRoot = process.cwd();
  const migrationsDir = path.join(repoRoot, "supabase", "migrations");
  const appDir = path.join(repoRoot, "app");
  const libDir = path.join(repoRoot, "lib");
  const supabaseDir = path.join(repoRoot, "supabase");

  const migFiles = listFiles(migrationsDir, [".sql"], []);
  let tableMap = {};
  for (const mf of migFiles) {
    const sql = readFileSafe(mf);
    const t = extractTablesFromSql(sql);
    tableMap = mergeTableSets(tableMap, t);
  }

  const appFiles = [
    ...listFiles(appDir, [".ts", ".tsx"], ["node_modules", ".next"]),
    ...listFiles(libDir, [".ts", ".tsx"], []),
  ];
  const supabaseFiles = [...listFiles(supabaseDir, [".sql", ".ts"], [])];

  const appUsage = scanUsage(appFiles, tableMap);

  // Strip CREATE TABLE bodies from supabase SQL before scanning usage
  const cleanedSupabaseFiles = [];
  const createRe =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\)\s*;/gi;
  for (const f of supabaseFiles) {
    let content = readFileSafe(f);
    if (!content) continue;
    content = content.replace(createRe, "");
    cleanedSupabaseFiles.push({ path: f, content });
  }
  // Write temp contents to scan easily
  const tmpDir = path.join(supabaseDir, ".tmp_scan");
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {}
  const tmpPaths = [];
  for (const c of cleanedSupabaseFiles) {
    const tmpPath = path.join(tmpDir, path.basename(c.path) + ".scan");
    try {
      fs.writeFileSync(tmpPath, c.content || "");
      tmpPaths.push(tmpPath);
    } catch {}
  }
  const supabaseUsage = scanUsage(tmpPaths, tableMap);
  // Cleanup temp files
  try {
    for (const p of tmpPaths) fs.unlinkSync(p);
    fs.rmdirSync(tmpDir);
  } catch {}

  const report = [];
  for (const t of Object.keys(tableMap)) {
    for (const c of tableMap[t]) {
      const au = (appUsage[t] && appUsage[t][c]) || { count: 0, examples: [] };
      const su =
        (supabaseUsage[t] && supabaseUsage[t][c]) || { count: 0, examples: [] };
      report.push({
        table: t,
        column: c,
        appCount: au.count,
        appExample: au.examples[0] || null,
        supabaseCount: su.count,
        supabaseExample: su.examples[0] || null,
      });
    }
  }
  report.sort((a, b) => {
    if (a.table === b.table) return a.column.localeCompare(b.column);
    return a.table.localeCompare(b.table);
  });

  const candidates = report.filter(
    (r) =>
      r.appCount === 0 &&
      r.supabaseCount === 0 &&
      !["id", "created_at", "updated_at"].includes(r.column)
  );

  const out = {
    analyzedTables: Object.keys(tableMap),
    candidatesToDrop: candidates,
    totalCandidates: candidates.length,
  };

  console.log(JSON.stringify(out, null, 2));
}

if (require.main === module) {
  main();
}
