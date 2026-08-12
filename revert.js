const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  await prisma.externalSystemRegistry.deleteMany({
    where: { systemName: 'Technical Asset Monitor (Auto)' }
  });
  
  let serverJs = fs.readFileSync('E:/Technical-Asset-Monitor-Backup/server.js', 'utf8');
  serverJs = serverJs.replace(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'/i, "'YOUR_API_KEY_HERE'");
  serverJs = serverJs.replace(/'[0-9a-f]{64}'/i, "'YOUR_HMAC_SECRET_HERE'");
  fs.writeFileSync('E:/Technical-Asset-Monitor-Backup/server.js', serverJs);
  console.log('Reverted.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
