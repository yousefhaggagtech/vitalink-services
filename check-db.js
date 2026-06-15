const sql = require('mssql');

sql.connect({
  server: 'bore.pub',
  port: 48577,
  database: 'VitaLinkDb',
  user: 'sa',
  password: 'admin',
  options: { encrypt: false, trustServerCertificate: true }
}).then(pool => {
  return pool.request().query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME');
}).then(result => {
  console.log('Tables found:');
  result.recordset.forEach(r => console.log(' -', r.TABLE_NAME));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});