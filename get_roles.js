const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.role.findMany().then(r => { console.log(r); prisma.$disconnect(); });
