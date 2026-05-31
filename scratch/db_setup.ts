import sql from 'mssql';

const dbConfig: sql.config = {
  user: 'sa',
  password: '11224433',
  server: '127.0.0.1',
  port: 1433,
  database: 'LITC_TS_v43',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

async function main() {
  console.log('Connecting to database...');
  const pool = await sql.connect(dbConfig);
  console.log('Connected.');

  console.log('Checking/Creating dbo.RolePermissions table...');
  
  // Drop table if it exists
  await pool.request().query(`
    IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL
    BEGIN
      DROP TABLE dbo.RolePermissions;
      PRINT 'Existing RolePermissions table dropped.';
    END
  `);

  // Create table
  await pool.request().query(`
    CREATE TABLE dbo.RolePermissions (
      RoleName NVARCHAR(100) NOT NULL PRIMARY KEY,
      CanTransfer BIT NOT NULL DEFAULT 0,
      CanClose BIT NOT NULL DEFAULT 0
    );
    PRINT 'RolePermissions table created successfully.';
  `);

  // Seed default data
  await pool.request().query(`
    INSERT INTO dbo.RolePermissions (RoleName, CanTransfer, CanClose)
    VALUES 
      ('Employee', 0, 0),
      ('Maintenance_Head', 1, 0),
      ('IT_Admin', 1, 1);
    PRINT 'Default roles injected successfully.';
  `);

  // Verify contents
  const result = await pool.request().query(`SELECT * FROM dbo.RolePermissions`);
  console.log('Verification query results:', result.recordset);

  await pool.close();
  console.log('Done.');
}

main().catch(console.error);
