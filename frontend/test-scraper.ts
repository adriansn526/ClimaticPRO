import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    const url = 'https://konnect-shop.ro/aer-conditionat/aparat-aer-conditionat-daikin-sensira-c-12000-btu-wi-fi-ftxc35e-rxc35e';
    
    console.log('Navigating...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const combinedSelector = '.price-normal, .price-new, .price';
    console.log('Matched text:', $(combinedSelector).first().text().trim());
    console.log('All matched:');
    $(combinedSelector).each((i, el) => {
        console.log(`[${i}] -> ` + $(el).text().trim());
    });

    // Also check page title to be sure we bypassed CF
    console.log('Page title:', $('title').text());

    await browser.close();
}

run().catch(console.error);
