const jwt = require('jsonwebtoken');

async function test() {
  try {
    const token = jwt.sign(
      { id: 20, roleId: 22, email: 'admin@litc.ly' },
      'LITC_LOCAL_DEV_JWT_9a7f3b2e8c1d4e6f0a5b8c2d9e7f4a3b',
      { expiresIn: '8h' }
    );
    const res = await fetch('http://localhost:5555/api/v1/org/departments', {
      headers: {
        'Cookie': `token=${token}; auth_token=${token}`,
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log('HTTP STATUS:', res.status);
    console.log('DEPARTMENTS COUNT:', data.departments?.length);
    console.log('DEPARTMENTS LIST:', JSON.stringify(data.departments?.map(d => ({
      id: d.id,
      name: d.name,
      divisionsCount: d.divisions?.length,
      teamsCount: d.teams?.length,
      unassignedCount: d.unassignedUsers?.length
    })), null, 2));
  } catch (err) {
    console.error('FETCH ERROR:', err);
  }
}
test();
