import app from '../src/app';
import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { prisma } from '../src/db/client';
import { Server } from 'http';
import sql from 'mssql';

// Configuration duplicate to get pool access for cleanup
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

async function runAnalyticsTest() {
  console.log('=== STARTING GOVERNANCE ANALYTICS INTEGRATION TEST ===\n');

  // 1. Ensure Roles exist in v43_Production for testing role guards
  console.log('Step 1: Upserting test roles in production database (handling Identity columns)...');
  
  try {
    // Check if IT_Admin exists
    const adminExists = await prisma.$queryRaw<any[]>`SELECT 1 FROM [Role] WHERE id = 1`;
    if (adminExists.length === 0) {
      await prisma.$executeRawUnsafe(`
        SET IDENTITY_INSERT [Role] ON;
        INSERT INTO [Role] (id, name, defaultCanViewInternal) VALUES (1, 'IT_Admin', 0);
        SET IDENTITY_INSERT [Role] OFF;
      `);
      console.log('✓ Created IT_Admin role with ID 1.');
    } else {
      await prisma.$executeRawUnsafe(`UPDATE [Role] SET name = 'IT_Admin' WHERE id = 1;`);
      console.log('✓ Updated IT_Admin role with ID 1.');
    }

    // Check if Employee exists
    const employeeExists = await prisma.$queryRaw<any[]>`SELECT 1 FROM [Role] WHERE id = 999`;
    if (employeeExists.length === 0) {
      await prisma.$executeRawUnsafe(`
        SET IDENTITY_INSERT [Role] ON;
        INSERT INTO [Role] (id, name, defaultCanViewInternal) VALUES (999, 'Employee', 0);
        SET IDENTITY_INSERT [Role] OFF;
      `);
      console.log('✓ Created Employee role with ID 999.');
    } else {
      await prisma.$executeRawUnsafe(`UPDATE [Role] SET name = 'Employee' WHERE id = 999;`);
      console.log('✓ Updated Employee role with ID 999.');
    }

  } catch (err: any) {
    console.error('✗ Role upsert failed:', err.message);
    throw err;
  }

  // 2. Seed some mock data in LITC_TS_v43 database for analytics checks
  console.log('\nStep 2: Seeding test tickets and audit logs in SQL Server...');
  const pool = await new sql.ConnectionPool(dbConfig).connect();

  let t1Id: string | null = null;
  let t2Id: string | null = null;

  try {
    const t1 = await DatabaseController.executeCreateTicket({
      title: 'Analytics Test Ticket 1',
      description: 'Testing SLA calculations',
      creatorId: 'usr-employee',
      department: 'IT',
      building: 'HQ Building'
    });
    t1Id = t1.TicketID;
    console.log(`✓ Seeded test ticket 1 (ID: ${t1Id})`);

    const t2 = await DatabaseController.executeCreateTicket({
      title: 'Analytics Test Ticket 2',
      description: 'Testing spam attempt detection',
      creatorId: 'usr-employee',
      department: 'Maintenance',
      building: 'HQ Building'
    });
    t2Id = t2.TicketID;
    console.log(`✓ Seeded test ticket 2 (ID: ${t2Id})`);

    // Perform transfers to create audit logs
    await DatabaseController.executeTransferTicket({
      ticketId: t1Id!,
      targetDepartment: 'Maintenance',
      user: 'admin_john',
      transferReason: 'Regular transfer for maintenance handler.'
    });
    console.log('✓ Performed standard handoff transfer');

    await DatabaseController.executeTransferTicket({
      ticketId: t2Id!,
      targetDepartment: 'IT',
      user: 'hacker_jim',
      transferReason: 'Violating access policies: hacker 409 exploit.'
    });
    console.log('✓ Performed suspicious handoff transfer (Spam candidate)');

    // 3. Test executeGetSLAAuditAnalytics direct call
    console.log('\nTest A: Calling DatabaseController.executeGetSLAAuditAnalytics() directly...');
    const stats = await DatabaseController.executeGetSLAAuditAnalytics();
    console.log('KPI Results:', stats.kpis);
    console.log('SLA Compliance:', stats.slaCompliance);
    
    // Find active hour
    const activeHour = new Date().getUTCHours();
    const currentHourStat = stats.hourlyViolations.find(h => h.hour === activeHour);
    console.log(`Hourly violations for hour ${activeHour}:`, currentHourStat);

    if (stats.kpis.totalTickets >= 2 && stats.kpis.spamAttempts >= 1 && stats.slaCompliance.length > 0) {
      console.log('✓ Success: DB direct query returned correct counts and aggregates.');
    } else {
      throw new Error('✗ Failure: Direct query assertions failed.');
    }

    // 4. Start API Server to verify route protection
    console.log('\nStep 3: Starting Express API Server...');
    let server: Server;
    await new Promise<void>((resolve) => {
      server = app.listen(5661, () => {
        console.log('Test server running on port 5661');
        resolve();
      });
    });

    try {
      // Test B: Unauthorized request (Missing header)
      console.log('\nTest B: GET /api/v1/admin/analytics/sla without credentials...');
      let res = await fetch('http://localhost:5661/api/v1/admin/analytics/sla');
      console.log(`HTTP Status: ${res.status}`);
      if (res.status === 401) {
        console.log('✓ Success: Request blocked with 401 Unauthorized.');
      } else {
        throw new Error('✗ Failure: Missing credentials was not blocked.');
      }

      // Test C: Forbidden request (Non-admin role)
      console.log('\nTest C: GET /api/v1/admin/analytics/sla with Employee credentials...');
      res = await fetch('http://localhost:5661/api/v1/admin/analytics/sla', {
        headers: {
          'x-user-id': '101',
          'x-role-id': '999' // Employee role
        }
      });
      console.log(`HTTP Status: ${res.status}`);
      if (res.status === 403) {
        console.log('✓ Success: Request blocked with 403 Forbidden.');
      } else {
        throw new Error('✗ Failure: Non-admin role was not blocked.');
      }

      // Test D: Authorized request (IT_Admin role)
      console.log('\nTest D: GET /api/v1/admin/analytics/sla with IT_Admin credentials...');
      res = await fetch('http://localhost:5661/api/v1/admin/analytics/sla', {
        headers: {
          'Authorization': 'Bearer system_token_123' // Maps to roleId: 1 (IT_Admin)
        }
      });
      console.log(`HTTP Status: ${res.status}`);
      const payload = await res.json() as any;
      console.log('API Response KPIs:', payload.kpis);

      if (res.status === 200 && payload.kpis && payload.slaCompliance && payload.hourlyViolations) {
        console.log('✓ Success: Analytics retrieved successfully with IT_Admin credentials.');
      } else {
        throw new Error('✗ Failure: IT_Admin request failed or returned invalid structure.');
      }

    } finally {
      console.log('\nStep 4: Shutting down Express server...');
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Test server closed.');
          resolve();
        });
      });
    }

  } finally {
    // 5. Cleanup seeded test data from SQL Server database
    console.log('\nStep 5: Cleaning up test data from database...');
    if (t1Id) {
      await pool.request().input('TicketId', sql.UniqueIdentifier, t1Id).query('DELETE FROM dbo.WorkflowAuditLogs WHERE TicketID = @TicketId');
      await pool.request().input('TicketId', sql.UniqueIdentifier, t1Id).query('DELETE FROM dbo.Tickets WHERE TicketID = @TicketId');
    }
    if (t2Id) {
      await pool.request().input('TicketId', sql.UniqueIdentifier, t2Id).query('DELETE FROM dbo.WorkflowAuditLogs WHERE TicketID = @TicketId');
      await pool.request().input('TicketId', sql.UniqueIdentifier, t2Id).query('DELETE FROM dbo.Tickets WHERE TicketID = @TicketId');
    }
    await pool.close();
    console.log('✓ Database cleaned and connection pool closed.');

    // Cleanup seeded test roles from production database
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM [Role] WHERE id IN (1, 999);`);
      console.log('✓ Cleaned up seeded test roles from production database.');
    } catch (e: any) {
      console.log('Warning: Clean up of test roles failed (ignored):', e.message);
    }
  }

  console.log('\n=== ALL GOVERNANCE ANALYTICS INTEGRATION TESTS PASSED! ===');
}

runAnalyticsTest().catch((err) => {
  console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
  process.exit(1);
});
