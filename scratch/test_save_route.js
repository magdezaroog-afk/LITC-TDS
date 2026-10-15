const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'litc_prod_sec_2026_q8w9e0r1t2y3u4i5o6p7';
const adminToken = jwt.sign({ id: 20, email: 'admin@litc.ly', roleId: 1 }, JWT_SECRET, { expiresIn: '1d' });

async function testSave() {
  const getRes = await fetch('http://localhost:5555/api/v1/routing/routes', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const getData = await getRes.json();
  console.log('Fetched routes count:', getData.routes?.length);

  const itRoute = getData.routes.find(r => r.id === 'route_it_1788081440290');
  console.log('Before Save - itRoute managerId:', itRoute?.managerId, 'managerName:', itRoute?.managerName);

  // Send save request
  const saveRes = await fetch('http://localhost:5555/api/v1/routing/routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ routes: getData.routes })
  });
  const saveData = await saveRes.json();
  console.log('Save response status:', saveRes.status, 'success:', saveData.success);

  // Check what was stored
  const verifyRes = await fetch('http://localhost:5555/api/v1/routing/routes', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const verifyData = await verifyRes.json();
  const verifiedRoute = verifyData.routes.find(r => r.id === 'route_it_1788081440290');
  console.log('After Save - verifiedRoute managerId:', verifiedRoute?.managerId, 'managerName:', verifiedRoute?.managerName);
}

testSave().catch(console.error);
