require("dotenv").config();
const { Client } = require("pg");

const targetFunctions = [
  "handle_user_update",
  "handle_new_user",
  "log_audit_action",
  "get_student_monthly_amount",
  "generate_monthly_dues",
  "validate_student_group_membership",
  "update_overdue_status",
  "check_tenant_limits",
  "recompute_subscription_monthly_amount",
  "sync_subscription_with_group",
  "sync_subscription_on_group_fee_update",
  "update_registration_link_count",
  "update_due_after_payment",
  "check_subscription_expiry",
  "get_student_monthly_amount_for_branch",
  "compute_monthly_due",
  "generate_monthly_dues_v2",
  "compute_monthly_due_v3",
  "generate_monthly_dues_v3",
  "get_student_attendance_rate",
  "update_group_student_count",
  "get_current_user_tenant_id",
  "create_monthly_due_on_group_join",
  "update_overdue_status_pending_only",
  "get_student_monthly_amount_for_month",
];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const fn of targetFunctions) {
      const { rows } = await client.query(
        `SELECT p.oid, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
         FROM pg_catalog.pg_proc p
         JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname='public' AND p.proname=$1`,
        [fn]
      );
      if (!rows.length) {
        console.warn(`Not found: public.${fn}`);
        continue;
      }
      const args = rows[0].args || "";
      const alter = `ALTER FUNCTION public.${fn}(${args}) SET search_path = '';`;
      console.log(alter);
      try {
        await client.query(alter);
      } catch (e) {
        console.error(`error: ${e.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
