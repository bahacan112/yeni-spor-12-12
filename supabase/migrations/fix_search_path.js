require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT p.oid, n.nspname AS schema, p.proname AS name, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args, p.proconfig
       FROM pg_catalog.pg_proc p
       JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column';`
    );
    if (!rows.length) {
      console.error("Function not found");
      process.exit(2);
    }
    const args = rows[0].args || "";
    console.log("Args:", args);
    const alterSql = `ALTER FUNCTION public.update_updated_at_column(${args}) SET search_path = '';`;
    console.log("Run:", alterSql);
    await client.query(alterSql);

    const { rows: verify } = await client.query(
      `SELECT p.proconfig
       FROM pg_catalog.pg_proc p
       JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column';`
    );
    const cfg = verify[0]?.proconfig || [];
    console.log("proconfig:", cfg);
    const ok =
      Array.isArray(cfg) &&
      cfg.some((v) => String(v).startsWith("search_path="));
    if (ok) {
      console.log("search_path ok");
    } else {
      console.warn("search_path not found");
      const { rows: check } = await client.query(
        `SELECT proname, pg_catalog.pg_get_functiondef(oid) AS def FROM pg_catalog.pg_proc WHERE proname='update_updated_at_column';`
      );
      console.log("def:", check[0]?.def || "");
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(3);
});
