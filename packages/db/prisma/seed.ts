import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmlease.com' },
    update: {},
    create: {
      email: 'admin@farmlease.com',
      name: 'FarmLease Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phone: '+1234567890',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
