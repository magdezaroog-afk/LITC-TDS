const https = require('https');

https.get('https://spline.design/community', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const regex = /href="https:\/\/app\.spline\.design\/community\/file\/([^"]+)"/g;
    let match;
    const links = new Set();
    while ((match = regex.exec(data)) !== null) {
      links.add(match[1]);
    }
    console.log(Array.from(links).slice(0, 15).map(id => `https://app.spline.design/community/file/${id}`).join('\n'));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
