const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function alterColumn() {
  try {
    console.log('Altering SystemSetting.settingValue to NVARCHAR(MAX)...');
    await prisma.$executeRawUnsafe(`ALTER TABLE SystemSetting ALTER COLUMN settingValue NVARCHAR(MAX) NOT NULL`);
    console.log('✅ Column successfully updated to NVARCHAR(MAX)!');
  } catch (err) {
    console.error('Error altering column:', err);
  }
}

alterColumn().finally(() => prisma.$disconnect());
