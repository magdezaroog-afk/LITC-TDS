import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 

const MOCK_USERNAMES = [
  'T-001', 'T-002', 'T-003', 'T-004', 
  'qais', 'aws', 'ahmed.s', 'sara.m', 
  'khaled.o', 'fatima.a', 'omar.m'
];

async function main() { 
  console.log('Deleting mock users...');
  const deleted = await prisma.user.deleteMany({
    where: {
      username: { in: MOCK_USERNAMES }
    }
  });
  console.log(`Deleted ${deleted.count} mock users.`);

  console.log('Setting default password for new users...');
  // Hash for 'admin123'
  const defaultPasswordHash = '$argon2id$v=19$m=65536,p=4,t=3$lZnr5vYpN1fGmh2ukNHTgw$d3jjLEY6ahtTTuiCPp0vsbTlaBW3twIgB0+pdchGmAI';

  const updated = await prisma.user.updateMany({
    where: {
      password: null
    },
    data: {
      password: defaultPasswordHash
    }
  });
  console.log(`Updated passwords for ${updated.count} users.`);
} 

main().catch(console.error).finally(() => prisma.$disconnect());
