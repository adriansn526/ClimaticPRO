const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto("https://eurocool.ro/categorii/aparate-aer-conditionat/", { waitUntil: 'networkidle2' });
    const html = await page.content();
    const $ = cheerio.load(html);

    console.log("Pagination block:", $('.woocommerce-pagination').html());
    console.log("Load more block:", $('.wd-products-with-bg').next().html() || $('.wd-load-more').html());
    console.log("Any a tag with next or paged:", $('a[href*="page/"], a.next').length);
    await browser.close();
})();
