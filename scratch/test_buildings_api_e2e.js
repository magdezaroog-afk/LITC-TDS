const fs = require('fs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
} catch (e) {
  console.error('Could not read .env:', e.message);
}

async function testDelete() {
  const JWT_SECRET = process.env.JWT_SECRET;
  const token = jwt.sign(
    { id: 1, roleId: 1, email: 'admin@litc.ly' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const BASE_URL = 'http://localhost:5555/api/v1';

  const getRes = await axios.get(`${BASE_URL}/org/buildings`, { headers });
  console.log('Current Buildings in DB:', getRes.data);

  // Filter out the test building (id: 5)
  const remaining = getRes.data.filter(b => b.name !== 'موقع حقل السرير');
  console.log('Deleting "موقع حقل السرير", saving remaining:', remaining.map(b => b.name));

  const postRes = await axios.post(`${BASE_URL}/org/buildings`, { buildings: remaining }, { headers });
  console.log('Saved successfully. New list in response:', postRes.data.buildings.map(b => b.name));

  const verify = await axios.get(`${BASE_URL}/org/buildings`, { headers });
  console.log('Verified re-fetch from DB:', verify.data.map(b => b.name));
}

testDelete().catch(console.error);
