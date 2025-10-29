import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@company.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash('AdminPass123!'),
        firstName: 'System',
        lastName: 'Admin',
        role: Role.ADMIN,
      },
    });
    console.log('Created default admin account');
  }

  const employeeEmail = 'alice.johnson@company.com';
  const existingEmployee = await prisma.user.findUnique({ where: { email: employeeEmail } });

  if (!existingEmployee) {
    const employee = await prisma.user.create({
      data: {
        email: employeeEmail,
        passwordHash: await argon2.hash('EmpPass123!'),
        firstName: 'Alice',
        lastName: 'Johnson',
        role: Role.EMPLOYEE,
      },
    });

    await prisma.workMetadata.create({
      data: {
        userId: employee.id,
        meetingCount: 12,
        workHours: 42,
        stressIndicators: {
          stressLevel: 3,
          workloadLevel: 4,
          workLifeBalance: 0.45,
          socialSupport: 0.6,
        },
        workPatterns: {
          meetingDuration: 8,
          overtimeHours: 6,
          weekendWork: 2,
          emailCount: 65,
          stressEmailCount: 8,
          urgentEmailCount: 5,
          focusTimeRatio: 0.25,
          breakTimeRatio: 0.15,
          sleepQuality: 0.5,
          exerciseFrequency: 0.3,
          nutritionQuality: 0.6,
        },
      },
    });

    await prisma.burnoutScore.create({
      data: {
        userId: employee.id,
        score: 58,
        confidence: 0.82,
        riskFactors: {
          meetingOverload: 0.64,
          negativeSentiment: 0.52,
          workLifeImbalance: 0.48,
        },
        trend: 'increasing',
      },
    });
    console.log('Created sample employee data');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
