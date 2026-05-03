import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

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

  // Create account with password for admin (Better Auth stores passwords in account table)
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: admin.id,
      providerId: 'credential',
    },
  });

  // Always upsert the credential account so any stale hash gets replaced.
  // Better Auth's hashPassword uses scrypt — the same algorithm it uses to
  // verify passwords at sign-in, so this hash is fully compatible out of the box.
  const devPassword = process.env.DEV_ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await hashPassword(devPassword);

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        accountId: admin.id,
        providerId: 'credential',
        userId: admin.id,
        password: passwordHash,
      },
    });
  }

  console.log('✅ Admin user created:', admin.email);
  console.log('🔐 Default password: admin123');
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
