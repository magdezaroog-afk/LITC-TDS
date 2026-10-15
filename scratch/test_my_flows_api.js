const jwt = require('jsonwebtoken');

// Generate token for Majdi (1059)
const JWT_SECRET = process.env.JWT_SECRET || 'litc_prod_sec_2026_q8w9e0r1t2y3u4i5o6p7';
const majdiToken = jwt.sign({ id: 1059, email: 'majdi.alzarrouk@litc.ly', roleId: 25 }, JWT_SECRET, { expiresIn: '1d' });

async function test() {
  console.log('1. Testing with Majdi Token...');
  const res1 = await fetch('http://localhost:5555/api/v1/flow-governance/my-flows', {
    headers: { Authorization: `Bearer ${majdiToken}` }
  });
  const data1 = await res1.json();
  console.log('Response with Majdi token:', JSON.stringify(data1, null, 2));

  console.log('\n2. Testing with NO token (default dev behavior)...');
  const res2 = await fetch('http://localhost:5555/api/v1/flow-governance/my-flows');
  const data2 = await res2.json();
  console.log('Response with NO token:', JSON.stringify(data2, null, 2));
}

test().catch(console.error);
