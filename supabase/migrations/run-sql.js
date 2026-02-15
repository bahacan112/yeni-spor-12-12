const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });
const { Client } = require("pg");

async function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not found in .env");
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
}

async function runFile(filePath) {
  const client = await getClient();
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`[OK] Executed ${filePath}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`[ERR] ${filePath}:`, e.message);
    throw e;
  } finally {
    await client.end();
  }
}

async function testDuesFlow() {
  const client = await getClient();
  try {
    // Pick an active group with a non-zero monthly fee
    const { rows: groups } = await client.query(
      `SELECT id, tenant_id, branch_id, monthly_fee, name
       FROM public.groups
       WHERE status='active' AND monthly_fee IS NOT NULL AND monthly_fee > 0
       ORDER BY updated_at DESC LIMIT 1`
    );
    if (!groups.length)
      throw new Error("No active group with monthly_fee found");
    const group = groups[0];

    // Create a test student bound to same tenant/branch
    const { rows: srows } = await client.query(
      `INSERT INTO public.students
        (tenant_id, branch_id, full_name, birth_date, is_licensed, phone, email, status)
       VALUES ($1, $2, 'Test Aidat Öğrenci', '2011-01-01', false, '000', 'test@example.com', 'active')
       RETURNING id`,
      [group.tenant_id, group.branch_id]
    );
    const studentId = srows[0].id;

    // Add to group (will fire INSERT trigger to create monthly_dues)
    await client.query(
      `INSERT INTO public.student_groups (student_id, group_id, status, joined_at)
       VALUES ($1, $2, 'active', CURRENT_DATE)`,
      [studentId, group.id]
    );

    // Verify dues for current month
    const { rows: dues } = await client.query(
      `SELECT due_month::date AS due_month, due_date::date AS due_date, amount, status
       FROM public.monthly_dues
       WHERE student_id = $1 AND due_month = date_trunc('month', CURRENT_DATE)
       ORDER BY created_at DESC LIMIT 5`,
      [studentId]
    );

    // Check duplicates for this student by normalized month
    const { rows: dups } = await client.query(
      `SELECT date_trunc('month', due_month)::date AS mon, COUNT(*) AS cnt
       FROM public.monthly_dues WHERE student_id = $1
       GROUP BY mon HAVING COUNT(*) > 1`,
      [studentId]
    );

    console.log("[VERIFY] Group:", group);
    console.log("[VERIFY] Current month dues:", dues);
    console.log("[VERIFY] Duplicates:", dups);

    // Cleanup test student (cascades monthly_dues & student_groups)
    await client.query(`DELETE FROM public.students WHERE id = $1`, [
      studentId,
    ]);
    console.log("[OK] Cleanup completed");
  } finally {
    await client.end();
  }
}

async function testOverrides() {
  const client = await getClient();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    // Pick a tenant, branch, and ensure a group exists with monthly_fee
    const { rows: tenants } = await client.query(
      `SELECT id FROM public.tenants ORDER BY created_at LIMIT 1`
    );
    if (!tenants.length) throw new Error("No tenants available");
    const tenantId = tenants[0].id;
    const { rows: branches } = await client.query(
      `SELECT id FROM public.branches WHERE tenant_id=$1 ORDER BY created_at LIMIT 1`,
      [tenantId]
    );
    if (!branches.length) throw new Error("No branches for tenant");
    const branchId = branches[0].id;
    const { rows: groups } = await client.query(
      `SELECT id FROM public.groups WHERE tenant_id=$1 AND branch_id=$2 AND status='active' AND COALESCE(monthly_fee,0)>0 ORDER BY updated_at DESC LIMIT 1`,
      [tenantId, branchId]
    );
    let groupId;
    if (!groups.length) {
      const { rows: g } = await client.query(
        `INSERT INTO public.groups(tenant_id, branch_id, name, status, monthly_fee, license_requirement)
         VALUES ($1, $2, 'OverrideTestGroup', 'active', 1000, 'unlicensed') RETURNING id`,
        [tenantId, branchId]
      );
      groupId = g[0].id;
    } else {
      groupId = groups[0].id;
    }

    // Create student
    const { rows: srows } = await client.query(
      `INSERT INTO public.students(tenant_id, branch_id, full_name, status)
       VALUES ($1, $2, 'Override Test Öğrenci', 'active') RETURNING id`,
      [tenantId, branchId]
    );
    const studentId = srows[0].id;

    // Join to group
    await client.query(
      `INSERT INTO public.student_groups(student_id, group_id, status, joined_at)
       VALUES ($1, $2, 'active', CURRENT_DATE)`,
      [studentId, groupId]
    );

    const month = new Date().toISOString().slice(0, 7) + "-01";

    // Apply fixed override: 700
    await client.query(
      `INSERT INTO public.student_fee_overrides(tenant_id, branch_id, student_id, override_amount, discount_percent, effective_from)
       VALUES ($1, $2, $3, 700, NULL, CURRENT_DATE)
       ON CONFLICT (tenant_id, student_id, branch_id) DO UPDATE SET override_amount=EXCLUDED.override_amount, discount_percent=NULL`,
      [tenantId, branchId, studentId]
    );

    await client.query(`SELECT public.generate_monthly_dues_v3($1, $2, $3)`, [
      tenantId,
      branchId,
      month,
    ]);
    const { rows: ov1 } = await client.query(
      `SELECT override_amount, discount_percent, effective_from, effective_to
       FROM public.student_fee_overrides WHERE tenant_id=$1 AND student_id=$2 AND branch_id=$3`,
      [tenantId, studentId, branchId]
    );
    console.log("[VERIFY] Override row:", ov1[0]);
    const { rows: ov2 } = await client.query(
      `SELECT override_amount, discount_percent, effective_from, effective_to
       FROM public.student_fee_overrides WHERE tenant_id=$1 AND student_id=$2 AND branch_id=$3`,
      [tenantId, studentId, branchId]
    );
    console.log("[VERIFY] Override row (pct):", ov2[0]);
    const { rows: baseFixed } = await client.query(
      `SELECT public.get_student_monthly_amount_for_month($1, $2, $3) AS base`,
      [studentId, branchId, month]
    );
    const { rows: duesFixed } = await client.query(
      `SELECT amount, original_amount, computed_amount, calculation_notes
       FROM public.monthly_dues WHERE student_id=$1 AND due_month = date_trunc('month', $2::date)`,
      [studentId, month]
    );
    console.log("[VERIFY] Fixed override base:", baseFixed[0]);
    console.log("[VERIFY] Fixed override dues:", duesFixed[0]);

    // Switch to percent override: 20%
    await client.query(
      `UPDATE public.student_fee_overrides SET override_amount=NULL, discount_percent=20 WHERE tenant_id=$1 AND student_id=$2 AND branch_id=$3`,
      [tenantId, studentId, branchId]
    );
    await client.query(`SELECT public.generate_monthly_dues_v3($1, $2, $3)`, [
      tenantId,
      branchId,
      month,
    ]);
    const { rows: basePct } = await client.query(
      `SELECT public.get_student_monthly_amount_for_month($1, $2, $3) AS base`,
      [studentId, branchId, month]
    );
    const { rows: duesPct } = await client.query(
      `SELECT amount, original_amount, computed_amount, calculation_notes
       FROM public.monthly_dues WHERE student_id=$1 AND due_month = date_trunc('month', $2::date)`,
      [studentId, month]
    );
    console.log("[VERIFY] Percent override base:", basePct[0]);
    console.log("[VERIFY] Percent override dues:", duesPct[0]);

    // Cleanup
    await client.query(`DELETE FROM public.monthly_dues WHERE student_id=$1`, [
      studentId,
    ]);
    await client.query(
      `DELETE FROM public.student_groups WHERE student_id=$1`,
      [studentId]
    );
    await client.query(
      `DELETE FROM public.student_fee_overrides WHERE student_id=$1`,
      [studentId]
    );
    await client.query(`DELETE FROM public.students WHERE id=$1`, [studentId]);
    console.log("[OK] Overrides test completed");
  } finally {
    await client.end();
  }
}

async function recomputeAll(monthArg) {
  const client = await getClient();
  try {
    const month = monthArg || new Date().toISOString().slice(0, 7) + "-01";
    const { rows: branches } = await client.query(
      `SELECT b.id AS branch_id, b.tenant_id FROM public.branches b WHERE COALESCE(b.is_active, true) = true`
    );
    for (const b of branches) {
      await client.query(`SELECT public.generate_monthly_dues_v3($1, $2, $3)`, [
        b.tenant_id,
        b.branch_id,
        month,
      ]);
      console.log(`[OK] Recomputed branch ${b.branch_id} for ${month}`);
    }
    console.log("[OK] Recompute completed for all active branches");
  } finally {
    await client.end();
  }
}

async function reportMonth(monthArg) {
  const client = await getClient();
  try {
    const month = monthArg || new Date().toISOString().slice(0, 7) + "-01";
    const { rows: stats } = await client.query(
      `SELECT
         COUNT(*) AS total,
         SUM(COALESCE(computed_amount, amount)) AS expected_total,
         SUM(COALESCE(paid_amount,0)) AS paid_total,
         SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid_count,
         SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) AS partial_count,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) AS overdue_count
       FROM public.monthly_dues
       WHERE due_month = date_trunc('month', $1::date)`,
      [month]
    );
    console.log("[REPORT] Month:", month, stats[0]);
  } finally {
    await client.end();
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "run") {
    const target = process.argv[3];
    if (!target) {
      console.error(
        "Missing file path. Usage: node scripts/run-sql.js run <path>"
      );
      process.exit(1);
    }
    await runFile(target);
    return;
  }
  if (cmd === "repair") {
    await runFile("scripts/008-repair-db.sql");
    return;
  }
  if (cmd === "repair-min") {
    const client = await getClient();
    try {
      await client.query(
        `DROP TRIGGER IF EXISTS trg_monthly_due_on_student_group_update ON public.student_groups;`
      );
      await client.query(`
        WITH norm AS (
          SELECT id, student_id,
                 date_trunc('month', due_month)::date AS nm,
                 created_at
          FROM public.monthly_dues
        ), dup AS (
          SELECT student_id, nm, array_agg(id ORDER BY created_at DESC) AS ids
          FROM norm
          GROUP BY student_id, nm
          HAVING COUNT(*) > 1
        ), to_delete AS (
          SELECT unnest(ids[2:]) AS id FROM dup
        )
        DELETE FROM public.monthly_dues WHERE id IN (SELECT id FROM to_delete);
      `);
      await client.query(`
        UPDATE public.monthly_dues
        SET due_month = date_trunc('month', due_month)::date,
            due_date = (date_trunc('month', due_month) + INTERVAL '1 month' - INTERVAL '1 day')::date
        WHERE due_month <> date_trunc('month', due_month);
      `);
      console.log("[OK] Minimal repair done");
    } finally {
      await client.end();
    }
    return;
  }
  if (cmd === "schedule-overdue") {
    const client = await getClient();
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pg_cron;`);
      await client.query(`
        CREATE OR REPLACE FUNCTION public.update_overdue_status_pending_only()
        RETURNS VOID AS $$
        BEGIN
          UPDATE public.monthly_dues
            SET status = 'overdue'
          WHERE status = 'pending'
            AND due_date < (now() AT TIME ZONE 'Europe/Istanbul')::date;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_monthly_dues_pending_due_date
          ON public.monthly_dues (due_date)
          WHERE status = 'pending';
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update_overdue_status_daily') THEN
            PERFORM cron.schedule(
              'update_overdue_status_daily',
              '0 3 * * *',
              'SELECT public.update_overdue_status_pending_only();'
            );
          END IF;
        END $$;
      `);
      console.log("[OK] Overdue scheduler installed");
    } finally {
      await client.end();
    }
    return;
  }
  if (cmd === "test") {
    await testDuesFlow();
    return;
  }
  if (cmd === "test-overrides") {
    await testOverrides();
    return;
  }
  if (cmd === "recompute-all") {
    await recomputeAll(process.argv[3]);
    return;
  }
  if (cmd === "report-month") {
    await reportMonth(process.argv[3]);
    return;
  }
  if (cmd === "simulate") {
    const client = await getClient();
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      // Ensure 3 tenants exist
      const { rows: tenants } = await client.query(
        `SELECT id FROM public.tenants ORDER BY created_at LIMIT 3`
      );
      if (!tenants.length) throw new Error("No tenants found");

      // Ensure branches and groups per tenant
      for (const t of tenants) {
        const { rows: b } = await client.query(
          `SELECT id FROM public.branches WHERE tenant_id = $1 LIMIT 1`,
          [t.id]
        );
        let branchId = b.length ? b[0].id : null;
        if (!branchId) {
          const { rows: nb } = await client.query(
            `INSERT INTO public.branches(tenant_id, name, status)
             VALUES ($1, 'BulkTestBranch', 'active') RETURNING id`,
            [t.id]
          );
          branchId = nb[0].id;
        }

        const { rows: g } = await client.query(
          `SELECT id FROM public.groups
           WHERE tenant_id = $1 AND status='active' AND COALESCE(monthly_fee,0)>0 LIMIT 1`,
          [t.id]
        );
        if (!g.length) {
          await client.query(
            `INSERT INTO public.groups(tenant_id, branch_id, name, status, monthly_fee, license_requirement)
             VALUES ($1, $2, 'BulkTestGroup', 'active', 2000, 'unlicensed')`,
            [t.id, branchId]
          );
        }
      }

      // Insert 100 students across tenants
      const students = [];
      for (let i = 1; i <= 100; i++) {
        const tenant = tenants[Math.floor(Math.random() * tenants.length)].id;
        const { rows: b } = await client.query(
          `SELECT id FROM public.branches WHERE tenant_id = $1 LIMIT 1`,
          [tenant]
        );
        const branchId = b[0].id;
        const fullName = `BulkTest Student ${i}`;
        const email = `bulktest-${i}-${Date.now()}@example.com`;
        const { rows: s } = await client.query(
          `INSERT INTO public.students(tenant_id, branch_id, full_name, birth_date, is_licensed, phone, email, status)
           VALUES ($1, $2, $3, '2011-01-01', false, '000', $4, 'active') RETURNING id`,
          [tenant, branchId, fullName, email]
        );
        const studentId = s[0].id;
        students.push({
          id: studentId,
          tenant_id: tenant,
          branch_id: branchId,
        });
        const { rows: g } = await client.query(
          `SELECT id FROM public.groups WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 1`,
          [tenant]
        );
        await client.query(
          `INSERT INTO public.student_groups(student_id, group_id, status, joined_at)
           VALUES ($1, $2, 'active', CURRENT_DATE)`,
          [studentId, g[0].id]
        );
      }

      // Randomly set 30 dues as past due
      const { rows: dueStudents } = await client.query(
        `SELECT s.id FROM public.students s
         WHERE s.email LIKE 'bulktest-%' ORDER BY random() LIMIT 30`
      );
      if (dueStudents.length) {
        await client.query(
          `UPDATE public.monthly_dues md
           SET due_date = (CURRENT_DATE - ((1 + floor(random()*12))::int))::date
           WHERE md.student_id = ANY($1::uuid[])`,
          [dueStudents.map((r) => r.id)]
        );
      }

      // Run overdue updater
      await client.query(`SELECT public.update_overdue_status_pending_only();`);

      // Metrics
      const { rows: totalDues } = await client.query(
        `SELECT COUNT(*) AS cnt
         FROM public.monthly_dues md JOIN public.students s ON s.id=md.student_id
         WHERE s.email LIKE 'bulktest-%' AND md.due_month = date_trunc('month', CURRENT_DATE)`
      );
      const { rows: overdue } = await client.query(
        `SELECT COUNT(*) AS cnt
         FROM public.monthly_dues md JOIN public.students s ON s.id=md.student_id
         WHERE s.email LIKE 'bulktest-%' AND md.status='overdue'`
      );
      const { rows: duplicates } = await client.query(
        `SELECT COUNT(*) AS dup_total FROM (
           SELECT md.student_id, date_trunc('month', md.due_month)::date AS mon, COUNT(*) AS cnt
           FROM public.monthly_dues md JOIN public.students s ON s.id=md.student_id
           WHERE s.email LIKE 'bulktest-%'
           GROUP BY md.student_id, mon
           HAVING COUNT(*) > 1
         ) t`
      );

      console.log("[REPORT] total monthly_dues:", totalDues[0].cnt);
      console.log("[REPORT] overdue marked:", overdue[0].cnt);
      console.log("[REPORT] duplicates:", duplicates[0].dup_total);

      // Cleanup
      await client.query(
        `DELETE FROM public.monthly_dues md USING public.students s
         WHERE md.student_id=s.id AND s.email LIKE 'bulktest-%'`
      );
      await client.query(
        `DELETE FROM public.student_groups sg USING public.students s
         WHERE sg.student_id=s.id AND s.email LIKE 'bulktest-%'`
      );
      const { rowCount: deletedStudents } = await client.query(
        `DELETE FROM public.students WHERE email LIKE 'bulktest-%'`
      );
      console.log("[REPORT] students deleted:", deletedStudents);
    } catch (e) {
      console.error("FAILED simulate:", e.message);
      throw e;
    } finally {
      await client.end();
    }
    return;
  }
  console.log(
    "Usage: node scripts/run-sql.js [run <path>|repair|test|test-overrides|repair-min|schedule-overdue|simulate|recompute-all [YYYY-MM-01]|report-month [YYYY-MM-01]]"
  );
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
