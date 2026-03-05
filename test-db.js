const { Client } = require('pg');

const c = new Client({
  connectionString: 'postgres://postgres:Sxbho4AEJ1ugPcY6mjeCPN0xXmwqlpEb@168.231.110.194:5554/postgres'
});

(async () => {
  try {
    await c.connect();
    const result = await c.query('SELECT * FROM public.users LIMIT 3');
    console.log('=== USERS (ilk 3) ===');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error('HATA: ' + e.message);
  } finally {
    await c.end();
  }
})();
