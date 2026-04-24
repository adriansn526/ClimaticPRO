import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const installer = await prisma.installerProfile.findFirst({
    where: { isAutoAssignEnabled: true, status: 'approved' }
  });
  console.log("Installer Name:", installer?.name);
  console.log("Company Name:", installer?.companyName);
  console.log("Expo Push Token:", installer?.expoPushToken ? "EXISTS" : "MISSING");
}
main().catch(console.error).finally(() => prisma.$disconnect());
