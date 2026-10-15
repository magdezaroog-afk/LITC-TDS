import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 

async function main() { 
  const u1 = await prisma.user.findUnique({where:{username:'T-001'}}); 
  const u2 = await prisma.user.findUnique({where:{username:'majdi.alzarrouk'}}); 
  console.log('T-001 password:', u1?.password); 
  console.log('majdi password:', u2?.password); 
} 

main().finally(() => prisma.$disconnect());
