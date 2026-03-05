const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const c = new Client({
  connectionString: 'postgres://postgres:Sxbho4AEJ1ugPcY6mjeCPN0xXmwqlpEb@168.231.110.194:5554/postgres'
});

(async () => {
  try {
    await c.connect();
    console.log('DB connected');

    const sql = fs.readFileSync(
      path.join(__dirname, 'supabase/migrations/030-clean-all-test-data.sql'),
      'utf8'
    );

    await c.query(sql);
    console.log('Migration executed successfully! All test data cleaned.');

    const verify = await c.query(`
      SELECT 'tenants' as tablo, COUNT(*)::int as kayit FROM public.tenants
      UNION ALL SELECT 'branches', COUNT(*)::int FROM public.branches
      UNION ALL SELECT 'students', COUNT(*)::int FROM public.students
      UNION ALL SELECT 'monthly_dues', COUNT(*)::int FROM public.monthly_dues
      UNION ALL SELECT 'users', COUNT(*)::int FROM public.users
      UNION ALL SELECT 'groups', COUNT(*)::int FROM public.groups
      ORDER BY tablo
    `);
    console.log('\nVerification (all should be 0):');
    verify.rows.forEach(r => console.log(`  ${r.tablo}: ${r.kayit}`));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await c.end();
  }
})();
