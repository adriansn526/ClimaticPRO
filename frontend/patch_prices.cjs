const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Patching B2BProduct prices...");
    // Update all non-overridden products to make priceB2B equal to priceRetail
    await prisma.$executeRaw`UPDATE "B2BProduct" SET "priceB2B" = "priceRetail" WHERE "isPriceOverridden" = false;`;
    console.log("Prices patched successfully!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
