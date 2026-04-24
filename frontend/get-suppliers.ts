import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true }});
    console.log(suppliers);
}
run();
