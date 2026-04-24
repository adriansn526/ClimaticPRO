const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto("https://eurocool.ro/categorii/aparate-aer-conditionat/", { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);

    console.log("Products discovered:", $('a[href*="/produs/"]').length);
    const nextBtn = $('a.next.page-numbers').first();
    console.log("Pagination btn exists:", nextBtn.length > 0);
    console.log("Pagination href:", nextBtn.attr('href'));

    await browser.close();
})();
