const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5555,
  path: '/api/v1/admin/users',
  method: 'GET',
  headers: {
    // try with x-user-id fallback which authMiddleware allows
    'x-user-id': '114',
    'x-role-id': '1037'
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log(data); });
});

req.on('error', e => {
  console.error(`Problem with request: ${e.message}`);
});
req.end();
