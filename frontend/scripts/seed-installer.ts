import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Installer Test Account...");

    const hashedPassword = await bcrypt.hash('123456', 10);

    const installer = await prisma.installerProfile.upsert({
        where: { email: 'test@climaticpro.ro' },
        update: {
            password: hashedPassword,
            companyName: 'Instalator Test SRL'
        },
        create: {
            userId: 'installer_test_001',
            email: 'test@climaticpro.ro',
            password: hashedPassword,
            companyName: 'Instalator Test SRL',
            cui: 'RO12345678',
            regCom: 'J40/1234/2020',
            address: 'Bucuresti, Sector 1',
            isVatPayer: true
        }
    });

    console.log("Mock Installer Created:", installer);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
