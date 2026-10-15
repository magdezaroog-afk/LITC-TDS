import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 

async function main() { 
  const users = await prisma.user.findMany({ 
    select: { id: true, username: true, email: true, fullName: true, role: { select: { name: true } } } 
  }); 
  console.log(users); 
} 

main().finally(() => prisma.$disconnect());
