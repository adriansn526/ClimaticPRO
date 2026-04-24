import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
    console.log("Analyzing Altex Regional Stock DOM...");
    const browser = await puppeteer.launch({
        headless: "new" as any,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    let storeApiEndpoint = null;

    page.on('response', async res => {
        if (["fetch", "xhr"].includes(res.request().resourceType())) {
             const url = res.url();
             try {
                if (url.includes('api') && !url.includes('analytics') && !url.includes('tracking')) {
                    const text = await res.text();
                    if (text.includes('Bucuresti') || text.includes('stock') || text.includes('inventory')) {
                        console.log(`\n\n[!!!] GĂSIT API STOC MAGZINE: ${url}`);
                        console.log(`Snippet: ${text.substring(0, 300)}\n`);
                        storeApiEndpoint = url;
                    }
                }
             } catch(e) {}
        }
    });

    try {
        const productUrl = 'https://altex.ro/aparat-de-aer-conditionat-gree-fairy-r32-inverter-12000-btu-a-a-wi-fi-gr-12-gwh12acc-k6dna1d-i-kit-instalare-inclus-alb/cpd/AERGWH12K6DNA1D/';
        await page.goto(productUrl, { waitUntil: 'networkidle0', timeout: 60000 });
        console.log("Stare Idle realizată.");
        
        await new Promise(r => setTimeout(r, 6000));
        
        // Clic pe butonul Găsește In magazin
        await page.evaluate(() => {
            // Un mic artificiu: caut un buton / link cu textul "verifică stoc in magazine"
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const b = buttons.find(e => e.textContent?.toLowerCase().includes('magazin'));
            if (b) (b as HTMLElement).click();
        });
        
        await new Promise(r => setTimeout(r, 6000));

    } catch (e: any) {
        console.error("Eroare:", e.message);
    } finally {
        await browser.close();
    }
}

run();
