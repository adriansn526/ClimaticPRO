const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function check() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Evaluate in the page context to find elements with "1650" or "lei" and trace their classes
    const priceAnalysis = await page.evaluate(() => {
        const prices = [];
        document.querySelectorAll('.price, .special-price, [itemprop="price"], .product-price').forEach(el => {
            let context = '';
            let current = el;
            for(let i=0; i<3; i++) {
                if(current.parentElement) {
                    current = current.parentElement;
                    context = `<${current.tagName.toLowerCase()} class="${current.className}"> ` + context;
                }
            }
            prices.push({
                text: el.innerText.trim().substring(0, 50),
                classes: el.className,
                tagName: el.tagName.toLowerCase(),
                context: context
            });
        });
        return prices;
    });

    console.log("Found specific price-related elements in DOM:");
    priceAnalysis.forEach((p, idx) => {
        console.log(`\n[${idx}] Text: ${p.text.replace(/\s+/g, ' ')}\nClasses: <${p.tagName} class="${p.classes}">\nContext: ${p.context}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

check();
