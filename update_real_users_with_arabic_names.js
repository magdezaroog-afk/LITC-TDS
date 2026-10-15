const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  const users = [
    { email: 'Ahmed.Alnakoua@litc.ly', name: 'أحمد النكوع' },
    { email: 'mahmoud.alahammali@litc.ly', name: 'محمود الحمالي' },
    { email: 'mohamed.alosta@litc.ly', name: 'محمد الأسطى' },
    { email: 'nidhal.abughamja@litc.ly', name: 'نضال أبو غامجة' },
    { email: 'nasruldeen.ramadhan@litc.ly', name: 'نصر الدين رمضان' },
    { email: 'anas.abuzayyan@litc.ly', name: 'أنس بوزيان' },
    { email: 'Ahmed.almajdi@litc.ly', name: 'أحمد المجدي' },
    { email: 'abdalrahman.ragi@litc.ly', name: 'عبد الرحمن راجي' },
    { email: 'abdelmalk.albi@litc.ly', name: 'عبد الملك البي' },
    { email: 'abdulhamid.taajaldeen@litc.ly', name: 'عبد الحميد تاج الدين' },
    { email: 'abdulsalam.mohammed@litc.ly', name: 'عبد السلام محمد' },
    { email: 'abdulwahab.zarrugh@litc.ly', name: 'عبد الوهاب الزروق' },
    { email: 'ahmed.alfourti@litc.ly', name: 'أحمد الفورتي' },
    { email: 'ali.dhalaa@litc.ly', name: 'علي ضلاع' },
    { email: 'majdi.alzarrouk@litc.ly', name: 'مجدي الزروق' },
    { email: 'mohammed.alzayani@litc.ly', name: 'محمد الزياني' }
  ];
  
  for (const u of users) {
    const username = u.email.split('@')[0];
    
    // Check if user exists
    let existingUser = await prisma.user.findFirst({
        where: { email: u.email }
    });
    
    if (existingUser) {
        await prisma.user.update({
            where: { id: existingUser.id },
            data: { fullName: u.name, username: username }
        });
    } else {
        await prisma.user.create({
            data: {
                username: username,
                email: u.email,
                fullName: u.name,
                roleId: 2, // Assuming role 2 is standard user
                isActive: true,
                isDeleted: false
            }
        });
    }
  }
  console.log('Arabic names added/updated successfully in the database.');
}
main().finally(() => prisma.$disconnect());
