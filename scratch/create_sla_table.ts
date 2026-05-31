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

async function setup() {
  console.log('Connecting to SQL Server to setup SLAConfigurations table...');
  const pool = await new sql.ConnectionPool(dbConfig).connect();
  
  const createTableQuery = `
    IF OBJECT_ID('dbo.SLAConfigurations', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.SLAConfigurations;
        PRINT 'Dropped existing SLAConfigurations table.';
    END

    CREATE TABLE dbo.SLAConfigurations (
        ServiceType NVARCHAR(100) NOT NULL,
        IsEscalationEnabled BIT NOT NULL DEFAULT 1,
        ThresholdMinutes INT NOT NULL DEFAULT 120,
        EscalationTargetRole NVARCHAR(100) NOT NULL,
        
        CONSTRAINT PK_SLAConfigurations PRIMARY KEY CLUSTERED (ServiceType)
    );
    PRINT 'Created SLAConfigurations table.';

    INSERT INTO dbo.SLAConfigurations (ServiceType, IsEscalationEnabled, ThresholdMinutes, EscalationTargetRole)
    VALUES ('IT', 1, 120, 'IT_Admin');
    PRINT 'Seeded default IT SLA configuration.';
  `;

  try {
    const result = await pool.request().query(createTableQuery);
    console.log('Query completed successfully.');
    console.log(result);
  } catch (error) {
    console.error('Error executing database setup queries:', error);
  } finally {
    await pool.close();
  }
}

setup();
