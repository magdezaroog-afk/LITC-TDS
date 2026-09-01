import { prisma } from './src/db/client';

async function verifySystem() {
  console.log('=====================================================');
  console.log('🚀 LITC-TS SYSTEM REMEDIATION & VERIFICATION RUNNER');
  console.log('=====================================================\n');

  const BASE_URL = 'http://localhost:5555/api/v1';

  // 1. Ensure a test Admin user exists in SQL Server
  console.log('1. Ensuring test Admin user in SQL Server...');
  let adminRole = await prisma.role.findFirst({ where: { name: 'IT_Admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'IT_Admin' } });
  }

  let adminUser = await prisma.user.findFirst({ where: { email: 'admin@litc.ly' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@litc.ly',
        fullName: 'المدير التقني للنظام',
        roleId: adminRole.id,
        password: 'password123'
      }
    });
  }
  console.log(`✅ Admin user ready: ${adminUser.email} (ID: ${adminUser.id})`);

  // 2. Test Authentication (Login)
  console.log('\n2. Testing POST /auth/login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@litc.ly', password: 'password123' })
  });
  if (!loginRes.ok) throw new Error(`Login failed with status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`✅ Login Successful! User: ${loginData.user.fullName}, Token received.`);

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Test Telemetry Endpoint
  console.log('\n3. Testing GET /system/telemetry...');
  const telRes = await fetch(`${BASE_URL}/system/telemetry`, { headers: authHeaders });
  if (!telRes.ok) throw new Error(`Telemetry failed: ${telRes.status}`);
  const telData = await telRes.json();
  console.log(`✅ Telemetry Response: CPU=${telData.cpu}% RAM=${telData.memoryUsage}MB Uptime=${telData.uptime}s`);

  // 4. Test Session Authentication (/auth/me)
  console.log('\n4. Testing GET /auth/me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  if (!meRes.ok) throw new Error(`/auth/me failed: ${meRes.status}`);
  const meData = await meRes.json();
  console.log(`✅ /auth/me verified: Authenticated as User #${meData.user.id}`);

  // 5. Test Storage Attachment Upload
  console.log('\n5. Testing POST /storage/upload...');
  const uploadRes = await fetch(`${BASE_URL}/storage/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fileName: 'test-invoice.pdf',
      fileData: Buffer.from('LITC Verification Test Document').toString('base64'),
      mimeType: 'application/pdf'
    })
  });
  if (!uploadRes.ok) throw new Error(`Storage upload failed: ${uploadRes.status}`);
  const uploadData = await uploadRes.json();
  console.log(`✅ Storage upload success! File URL: ${uploadData.fileUrl}`);

  // 6. Test Ticket Creation with Attachment and Dynamic Fields
  console.log('\n6. Testing POST /tickets...');
  const ticketRes = await fetch(`${BASE_URL}/tickets`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'طلب صيانة سيرفر قاعدة البيانات الرئيسي',
      description: 'فحص دوري لحالة الأقراص والذاكرة وسجلات النظام',
      department: 'IT_SUPPORT',
      priority: 'HIGH',
      ticketType: 'INFRASTRUCTURE',
      customFields: {
        serverIp: '10.0.0.50',
        environment: 'Production'
      },
      files: [
        { fileName: 'test-invoice.pdf', fileUrl: uploadData.fileUrl, fileSize: 1024 }
      ]
    })
  });
  if (!ticketRes.ok) throw new Error(`Ticket creation failed: ${ticketRes.status}`);
  const ticketData = await ticketRes.json();
  console.log(`✅ Ticket created successfully! ID: ${ticketData.ticketId || ticketData.id}`);

  // 7. Test Ticket Retrieval & Inbox
  console.log('\n7. Testing GET /tickets & GET /db-tickets/my-inbox...');
  const listRes = await fetch(`${BASE_URL}/tickets`, { headers: authHeaders });
  const inboxRes = await fetch(`${BASE_URL}/db-tickets/my-inbox`, { headers: authHeaders });
  if (!listRes.ok || !inboxRes.ok) throw new Error('Ticket retrieval failed');
  const listData = await listRes.json();
  const inboxData = await inboxRes.json();
  console.log(`✅ Tickets listed: Total=${listData.tickets?.length}, Inbox count=${inboxData.tickets?.length}`);

  // 8. Test Operational User Policy Governance
  console.log('\n8. Testing POST /admin/operational/user-policy...');
  const policyRes = await fetch(`${BASE_URL}/admin/operational/user-policy`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: adminUser.id,
      componentKey: 'SYSTEM_SETTINGS',
      canClaimSelf: true,
      canForwardInternally: true,
      canRejectWithComment: true,
      canInterceptAndReassign: true,
      canCommentGlobally: true,
      changeSummary: 'Admin automated policy update'
    })
  });
  if (!policyRes.ok) throw new Error(`User policy failed: ${policyRes.status}`);
  console.log('✅ User Component Policy saved and synced successfully to SQL Server.');

  // 9. Test SLA Breach Scan
  console.log('\n9. Testing POST /sla/check-breaches...');
  const slaRes = await fetch(`${BASE_URL}/sla/check-breaches`, {
    method: 'POST',
    headers: authHeaders
  });
  if (!slaRes.ok) throw new Error(`SLA scan failed: ${slaRes.status}`);
  console.log('✅ SLA breach check and monitor job executed cleanly.');

  console.log('\n=====================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('=====================================================');
}

verifySystem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
