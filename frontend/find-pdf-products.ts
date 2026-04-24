import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const p = await prisma.b2BProduct.findMany({
        where: { OR: [ { name: { contains: 'ASEH12KNCA' } }, { name: { contains: 'ASEG18KLCA' } }, { name: { contains: 'ASEG24KLCA' } } ] }
    });
    console.log(`Found ${p.length} matching products.`);
    for (const x of p) console.log(x.name);
}
run();
