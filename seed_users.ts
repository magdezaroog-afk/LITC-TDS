import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const emails = [
  'Ahmed.Alnakoua@litc.ly',
  'mahmoud.alahammali@litc.ly',
  'mohamed.alosta@litc.ly',
  'nidhal.abughamja@litc.ly',
  'nasruldeen.ramadhan@litc.ly',
  'anas.abuzayyan@litc.ly',
  'Ahmed.almajdi@litc.ly',
  'abdalrahman.ragi@litc.ly',
  'abdelmalk.albi@litc.ly',
  'abdulhamid.taajaldeen@litc.ly',
  'abdulsalam.mohammed@litc.ly',
  'abdulwahab.zarrugh@litc.ly',
  'ahmed.alfourti@litc.ly',
  'ali.dhalaa@litc.ly',
  'majdi.alzarrouk@litc.ly',
  'admin@litc.ly'
];

async function seedUsers() {
  try {
    let role = await prisma.role.findFirst({
      where: { name: 'END_USER' }
    });

    if (!role) {
      role = await prisma.role.findFirst();
    }

    if (!role) {
       role = await prisma.role.create({ data: { name: 'END_USER' } });
    }

    const hashedPassword = await argon2.hash('1213456789');

    let count = 0;
    for (const email of emails) {
      const username = email.split('@')[0];
      const fullName = username.replace('.', ' ');

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            email,
            username,
            fullName,
            password: hashedPassword,
            roleId: role.id,
            isActive: true,
            ssoProvider: 'Microsoft_SSO',
            jobTitle: 'New Employee',
            presence: 'Online',
          }
        });
        count++;
        console.log(`Created user: ${email}`);
      } else {
        console.log(`User already exists: ${email}`);
      }
    }
    console.log(`Successfully processed ${emails.length} users. Inserted: ${count}.`);
  } catch (error) {
    console.error('Failed to seed users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
