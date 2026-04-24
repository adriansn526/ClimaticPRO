const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        console.log("Starting browser...");
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        await page.goto("https://altex.ro/aer-conditionat/cpl/", { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 4000));
        
        const catalogDump = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            
            // CPD = product detail
            const productLink = links.find(a => a.href.includes('/cpd/')); 
            const productCard = productLink ? productLink.closest('div.flex, li, article.product-item, .Products-item') : null;
            
            // P/2 = pagination Next
            const nextLink = links.find(a => a.href.endsWith('/p/2/') || a.href.includes('page=2'));
            const paginationContainer = nextLink ? nextLink.parentElement.parentElement : null;

            return {
                foundProductLink: productLink ? productLink.href : 'NONE',
                productLinkSelector: productLink && productLink.className ? 'a.' + productLink.className.split(' ').join('.') : 'a[href*="/cpd/"]',
                productCardSelector: productCard && productCard.className ? '.' + productCard.className.split(' ').join('.') : 'NONE',
                nextLinkSelector: nextLink && nextLink.className ? 'a.' + nextLink.className.split(' ').join('.') : 'a[href*="/p/2/"]'
            };
        });

        console.log("Catalog Analysis:", JSON.stringify(catalogDump, null, 2));

        if (catalogDump.foundProductLink && catalogDump.foundProductLink !== 'NONE') {
            await page.goto(catalogDump.foundProductLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await new Promise(r => setTimeout(r, 4000));
            
            const productDump = await page.evaluate(() => {
                const results = {
                    titleSelector: 'NONE',
                    priceSelector: 'NONE',
                    stockSelector: 'NONE'
                };

                const h1 = document.querySelector('h1');
                if (h1) results.titleSelector = h1.className ? 'h1.' + h1.className.split(' ').join('.') : 'h1';

                const priceMatches = Array.from(document.querySelectorAll('.Price-current, .Price-int, .price, [class*="Price"]'));
                if (priceMatches.length > 0) {
                    results.priceSelector = '.' + priceMatches[0].className.split(' ').filter(c=>c).join('.');
                } else {
                    // Search for "lei"
                    const elements = Array.from(document.body.querySelectorAll('*'));
                    for (const el of elements) {
                        if (el.textContent && el.textContent.toLowerCase().includes('lei') && el.children.length === 0 && el.textContent.length < 20) {
                            results.priceSelector = el.parentElement && el.parentElement.className ? '.' + el.parentElement.className.split(' ').join('.') : el.className;
                            break;
                        }
                    }
                }

                const stockMatches = Array.from(document.querySelectorAll('[class*="stock"], [class*="Stock"], [data-testid="stock-badge"]'));
                if (stockMatches.length > 0) {
                    results.stockSelector = '.' + stockMatches[0].className.split(' ').filter(c=>c).join('.');
                } else {
                    const elements = Array.from(document.body.querySelectorAll('*'));
                    for (const el of elements) {
                        if (el.textContent && (el.textContent.includes('in stoc') || el.textContent.toLowerCase().includes('in stoc')) && el.children.length === 0 && el.textContent.length < 30) {
                            results.stockSelector = el.parentElement && el.parentElement.className ? '.' + el.parentElement.className.split(' ').filter(c=>c).join('.') : el.className;
                            break;
                        }
                    }
                }

                return results;
            });

            console.log("Product Analysis:", JSON.stringify(productDump, null, 2));
        }

        await browser.close();
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
})();
