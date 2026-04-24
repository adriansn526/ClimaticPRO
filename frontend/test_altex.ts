import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
    console.log("Lansare test Altex...");
    const browser = await puppeteer.launch({
        headless: "new" as any,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Intercept API responses
    page.on('response', async (res) => {
        const url = res.url();
        if (url.includes('api.altex.ro')) {
            console.log(`[NETWORK] Responded: ${url}`);
            try {
                const text = await res.text();
                // Check if it's the stores endpoint
                if (text.includes('store') || text.includes('stock')) {
                    console.log(`\n\n--- GĂSIT API PROBABIL ---`);
                    console.log(`URL: ${url}`);
                    console.log(`Snippet: ${text.substring(0, 300)}`);
                    console.log(`------------------------------\n\n`);
                }
            } catch(e) {}
        }
    });

    try {
        // Go to a known AC category or product on Altex
        await page.goto('https://altex.ro/aparate-aer-conditionat/cpl/', { waitUntil: 'networkidle2' });
        
        // Clic pe primul produs din listă
        console.log("Caut produse...");
        const firstProductUrl = await page.$eval('ul.Products a.Product', el => (el as HTMLAnchorElement).href).catch(() => null);
        
        if (firstProductUrl) {
            console.log(`Găsit produs: ${firstProductUrl}`);
            await page.goto(firstProductUrl, { waitUntil: 'networkidle2' });
            console.log("Suntem pe pagina de produs. Așteptăm 5 secunde să vâneze requesturile...");
            await new Promise(r => setTimeout(r, 5000));
        } else {
            console.log("Nu am găsit selectorul de listă, dar am lăsat logul.");
        }
    } catch (e: any) {
        console.error("Eroare:", e.message);
    } finally {
        await browser.close();
    }
}

run();
