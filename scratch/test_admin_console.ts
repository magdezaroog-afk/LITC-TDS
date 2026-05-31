import app from '../src/app';
import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { Server } from 'http';

async function runTest() {
  console.log('=== STARTING ADMIN GOVERNANCE CONSOLE INTEGRATION TEST ===\n');

  // Step 1: Query initial permissions for Employee
  console.log('Step 1: Checking current Employee permissions...');
  const initEmpPerms = await DatabaseController.executeGetPermissions('Employee');
  console.log('Initial Employee permissions:', initEmpPerms);

  // Step 2: Start API Server to verify PUT /api/v1/admin/permissions
  console.log('\nStep 2: Starting API server...');
  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(5658, () => {
      console.log('Admin test server running on port 5658');
      resolve();
    });
  });

  try {
    // A. Verify PUT /admin/permissions with authorization
    console.log('\nTest A: Updating Employee permissions to CanTransfer=true...');
    let res = await fetch('http://localhost:5658/api/v1/admin/permissions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer system_token_123'
      },
      body: JSON.stringify({
        roleName: 'Employee',
        canTransfer: true,
        canClose: false
      })
    });
    let data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);

    if (res.status === 200 && data.status === 'success') {
      console.log('✓ Permission updated successfully via HTTP.');
    } else {
      throw new Error('✗ Failed to update permission via HTTP!');
    }

    // Verify DB update
    const updatedEmpPerms = await DatabaseController.executeGetPermissions('Employee');
    console.log('Updated Employee permissions in DB:', updatedEmpPerms);
    if (updatedEmpPerms.canTransfer === true && updatedEmpPerms.canClose === false) {
      console.log('✓ DB updated state verified.');
    } else {
      throw new Error('✗ DB update validation failed.');
    }

    // B. Revert Employee permissions to default (CanTransfer=false)
    console.log('\nTest B: Reverting Employee permissions to CanTransfer=false...');
    res = await fetch('http://localhost:5658/api/v1/admin/permissions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer system_token_123'
      },
      body: JSON.stringify({
        roleName: 'Employee',
        canTransfer: false,
        canClose: false
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    if (res.status === 200 && data.status === 'success') {
      console.log('✓ Permission reverted successfully.');
    } else {
      throw new Error('✗ Failed to revert permission.');
    }

    // C. Verify GET /api/v1/admin/audit-logs
    console.log('\nTest C: Fetching governance audit logs...');
    res = await fetch('http://localhost:5658/api/v1/admin/audit-logs', {
      headers: {
        'Authorization': 'Bearer system_token_123'
      }
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Number of audit logs retrieved: ${data.data?.length}`);
    if (res.status === 200 && data.status === 'success' && Array.isArray(data.data)) {
      console.log('✓ Audit logs fetched successfully.');
      if (data.data.length > 0) {
        console.log('First log sample:', data.data[0]);
      }
    } else {
      throw new Error('✗ Failed to retrieve audit logs.');
    }

    // D. Verify Authentication block on admin routes
    console.log('\nTest D: Verifying protection on PUT /admin/permissions without auth headers...');
    res = await fetch('http://localhost:5658/api/v1/admin/permissions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roleName: 'Employee',
        canTransfer: true,
        canClose: true
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    if (res.status === 401) {
      console.log('✓ Access blocked as expected (401).');
    } else {
      throw new Error('✗ Protection failed, allowed request without authorization!');
    }

  } finally {
    console.log('\nStep 3: Shutting down test server...');
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('Test server closed.');
        resolve();
      });
    });
  }

  console.log('\n=== ALL ADMIN GOVERNANCE CONSOLE INTEGRATION TESTS PASSED! ===');
}

runTest().catch((err) => {
  console.error('\n✗ TEST RUN ENCOUNTERED AN ERROR:', err);
  process.exit(1);
});
