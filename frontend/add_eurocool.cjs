const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log("Analyzing Eurocool (WooCommerce detected)...");
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto("https://eurocool.ro/categorii/aparate-aer-conditionat/", { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const catalogDump = await page.evaluate(() => {
            const productLinks = Array.from(document.querySelectorAll('a[href*="/produs/"]'));
            const nextLink = document.querySelector('a.next.page-numbers, .pagination a.next');
            return {
                foundProduct: productLinks.length > 0 ? productLinks[0].href : null,
                productLinkSelector: productLinks.length > 0 ? 'a[href*="/produs/"]' : 'NONE',
                paginationSelector: nextLink ? (nextLink.className ? 'a.' + nextLink.className.split(' ').join('.') : 'a.next') : 'a.next.page-numbers'
            };
        });

        console.log("Catalog Analysis:", JSON.stringify(catalogDump, null, 2));

        let titleS = 'h1.product_title, h1';
        let priceS = 'p.price, .price .amount, .summary .price';
        let stockS = '.stock, .in-stock, p.stock';

        if (catalogDump.foundProduct) {
            await page.goto(catalogDump.foundProduct, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const pDump = await page.evaluate(() => {
                const t = document.querySelector('h1.product_title, h1');
                const p = document.querySelector('p.price, div.price');
                const s = document.querySelector('.stock, .availability');
                return {
                    title: t ? t.tagName.toLowerCase() + (t.className ? '.'+t.className.split(' ').join('.') : '') : 'h1',
                    price: p ? p.tagName.toLowerCase() + (p.className ? '.'+p.className.split(' ').join('.') : '') : '.price',
                    stock: s ? s.tagName.toLowerCase() + (s.className ? '.'+s.className.split(' ').join('.') : '') : '.stock'
                };
            });
            titleS = pDump.title;
            priceS = pDump.price;
            stockS = pDump.stock;
            console.log("Product Analysis:", JSON.stringify(pDump, null, 2));
        }
        await browser.close();

        console.log("Saving Eurocool into Database...");
        const crawlerConfig = {
            catalogUrls: ["https://eurocool.ro/categorii/aparate-aer-conditionat/"],
            productLinkSelector: catalogDump.productLinkSelector,
            paginationSelector: catalogDump.paginationSelector,
            titleSelector: titleS,
            priceSelector: priceS,
            stockSelector: stockS
        };

        const supplierParams = {
            name: "EUROCOOL",
            cui: "RO12345678",
            contact: "Robot Eurocool",
            phone: "0762 995 914",
            email: "vanzari@eurocool.ro",
            address: "Bucuresti",
            websiteUrl: "https://eurocool.ro",
            active: true,
            crawlerConfig: crawlerConfig
        };

        let existing = await prisma.supplier.findFirst({ where: { name: { contains: 'EUROCOOL', mode: 'insensitive' } } });
        if (existing) {
            await prisma.supplier.update({ where: { id: existing.id }, data: supplierParams });
            console.log("Eurocool Updated!");
        } else {
            await prisma.supplier.create({ data: supplierParams });
            console.log("Eurocool Created!");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
})();
