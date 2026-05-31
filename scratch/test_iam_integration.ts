import app from '../src/app';
import { prisma } from '../src/db/client';
import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { Server } from 'http';

async function runTest() {
  console.log('=== STARTING SOVEREIGN IAM PERMISSIONS INTEGRATION TEST ===\n');

  // Test 1: Direct Controller Method Verification
  console.log('Step 1: Testing direct DatabaseController query execution...');
  
  const employeePerms = await DatabaseController.executeGetPermissions('Employee');
  console.log('Employee permissions (Expected: canTransfer=false, canClose=false):');
  console.log(employeePerms);
  if (employeePerms.canTransfer === false && employeePerms.canClose === false) {
    console.log('✓ Employee verification passed.');
  } else {
    throw new Error('✗ Employee verification failed.');
  }

  const maintPerms = await DatabaseController.executeGetPermissions('Maintenance_Head');
  console.log('Maintenance_Head permissions (Expected: canTransfer=true, canClose=false):');
  console.log(maintPerms);
  if (maintPerms.canTransfer === true && maintPerms.canClose === false) {
    console.log('✓ Maintenance_Head verification passed.');
  } else {
    throw new Error('✗ Maintenance_Head verification failed.');
  }

  const adminPerms = await DatabaseController.executeGetPermissions('IT_Admin');
  console.log('IT_Admin permissions (Expected: canTransfer=true, canClose=true):');
  console.log(adminPerms);
  if (adminPerms.canTransfer === true && adminPerms.canClose === true) {
    console.log('✓ IT_Admin verification passed.');
  } else {
    throw new Error('✗ IT_Admin verification failed.');
  }

  // Verify 'admin' role bypass mapping
  const adminBypassPerms = await DatabaseController.executeGetPermissions('admin');
  console.log('admin bypass permissions (Expected: canTransfer=true, canClose=true):');
  console.log(adminBypassPerms);
  if (adminBypassPerms.canTransfer === true && adminBypassPerms.canClose === true) {
    console.log('✓ Admin bypass mapping verified.');
  } else {
    throw new Error('✗ Admin bypass mapping failed.');
  }

  // Verify unknown role defaults to false
  const unknownPerms = await DatabaseController.executeGetPermissions('NonExistentRole');
  console.log('Unknown role permissions (Expected: canTransfer=false, canClose=false):');
  console.log(unknownPerms);
  if (unknownPerms.canTransfer === false && unknownPerms.canClose === false) {
    console.log('✓ Unknown role default verified.');
  } else {
    throw new Error('✗ Unknown role verification failed.');
  }

  // Test 2: API Route and Authentication Verification
  console.log('\nStep 2: Starting API server to test GET /api/v1/auth/permissions/:roleName...');
  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(5657, () => {
      console.log('Test server running on port 5657');
      resolve();
    });
  });

  try {
    // A. Request without authentication (Expect 401)
    console.log('\nTest A: Requesting permissions endpoint without auth header...');
    let res = await fetch('http://localhost:5657/api/v1/auth/permissions/IT_Admin');
    let data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 401 && data.status === 'error') {
      console.log('✓ Success: Endpoint is protected.');
    } else {
      throw new Error('✗ Failure: Endpoint is unprotected!');
    }

    // B. Request with valid auth token for IT_Admin
    console.log('\nTest B: Requesting permissions for IT_Admin with system token...');
    res = await fetch('http://localhost:5657/api/v1/auth/permissions/IT_Admin', {
      headers: {
        'Authorization': 'Bearer system_token_123'
      }
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 200 && data.canTransfer === true && data.canClose === true) {
      console.log('✓ Success: Retrieved correct permissions via HTTP.');
    } else {
      throw new Error('✗ Failure: HTTP endpoint returned incorrect data!');
    }

    // C. Request with valid auth token for Employee
    console.log('\nTest C: Requesting permissions for Employee...');
    res = await fetch('http://localhost:5657/api/v1/auth/permissions/Employee', {
      headers: {
        'Authorization': 'Bearer system_token_123'
      }
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 200 && data.canTransfer === false && data.canClose === false) {
      console.log('✓ Success: Retrieved correct permissions for Employee via HTTP.');
    } else {
      throw new Error('✗ Failure: HTTP endpoint returned incorrect data for Employee!');
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

  console.log('\n=== ALL IAM PERMISSIONS INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n✗ TEST RUN FAILED:', err);
  process.exit(1);
});
