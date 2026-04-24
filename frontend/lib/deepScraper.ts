import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

puppeteer.use(StealthPlugin());

export interface DeepScraperConfig {
  titleSelector?: string;
  priceSelector?: string;
  descriptionSelector?: string;
  imageSelector?: string;
  specsSelector?: string; // e.g. 'table.tech-specs'
  categorySelector?: string; // e.g. '.breadcrumbs li a'
}

export interface DeepScrapedData {
  url: string;
  title: string | null;
  price: number;
  descriptionHtml: string | null;
  images: string[];
  categoryText: string | null;
  attributes: Record<string, string>;
}

function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  const cleanStr = priceStr.replace(/[^\d.,]/g, '');
  let normalized = cleanStr;
  const lastCommaIndex = cleanStr.lastIndexOf(',');
  const lastDotIndex = cleanStr.lastIndexOf('.');

  if (lastCommaIndex > lastDotIndex) {
    normalized = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (lastDotIndex > lastCommaIndex) {
    normalized = cleanStr.replace(/,/g, '');
  }

  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export async function runDeepScrape(url: string, config: DeepScraperConfig): Promise<DeepScrapedData> {
  const args = [
       '--no-sandbox', 
       '--disable-setuid-sandbox', 
       '--disable-dev-shm-usage',
       '--disable-gpu',
       '--no-zygote',
       '--single-process',
       '--ignore-certificate-errors'
  ];

  if (process.env.SCRAPER_PROXY_URL) {
      args.push(`--proxy-server=${process.env.SCRAPER_PROXY_URL}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: args
  });

  const result: DeepScrapedData = {
    url,
    title: null,
    price: 0,
    descriptionHtml: null,
    images: [],
    categoryText: null,
    attributes: {}
  };

  try {
    const page = await browser.newPage();
    
    if (process.env.SCRAPER_PROXY_USER && process.env.SCRAPER_PROXY_PASS) {
        await page.authenticate({
            username: process.env.SCRAPER_PROXY_USER,
            password: process.env.SCRAPER_PROXY_PASS,
        });
    }

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8'
    });

    console.log(`[DeepScraper] Visiting: ${url}`);
    
    // We allow up to 30s but we only need DOM
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Try to wait for title or main block to ensure SPA pages render
    if (config.titleSelector) {
        try { await page.waitForSelector(config.titleSelector, { timeout: 3000 }); } catch (e) {}
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    // Title & Price
    if (config.titleSelector) {
        result.title = $(config.titleSelector).first().text().trim();
    }
    if (config.priceSelector) {
        const pText = $(config.priceSelector).first().text().trim();
        result.price = parsePrice(pText);
    }

    // Category Map (Breadcrumbs)
    if (config.categorySelector) {
        const catNodes = $(config.categorySelector);
        if (catNodes.length > 0) {
            // usually the last or second to last breadcrumb is the category. 
            // e.g. Home > Aer Conditionat > Yamato
            // We join them or pick the last meaningful one.
            const cats: string[] = [];
            catNodes.each((_, el) => {
                const text = $(el).text().replace(/>/g, '').trim();
                // ignore trivial ones like "Home" or "Acasa"
                if (text && text.toLowerCase() !== 'acasa' && text.toLowerCase() !== 'home') {
                    cats.push(text);
                }
            });
            if (cats.length > 0) {
                // Return the deepest category
                result.categoryText = cats[cats.length - 1];
            }
        }
    }

    // Description HTML
    if (config.descriptionSelector) {
        const descBlock = $(config.descriptionSelector).first();
        if (descBlock.length > 0) {
            // Strip out obvious garbage like script tags, tracking pixels
            descBlock.find('script, iframe, style').remove();
            
            // Rewrite local URLs to absolute if needed? Usually not needed if we just show it.
            // But let's just grab the inner HTML
            result.descriptionHtml = descBlock.html()?.trim() || null;
        }
    }

    // Images
    if (config.imageSelector) {
        $(config.imageSelector).each((_, imgEl) => {
            let src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('href');
            if (src) {
                // If it's a relative URL, make it absolute
                if (src.startsWith('/')) {
                    const urlObj = new URL(url);
                    src = `${urlObj.origin}${src}`;
                }
                
                // Avoid small thumbnails by checking keywords if needed, or assume selector is good
                if (!result.images.includes(src)) {
                     result.images.push(src);
                }
            }
        });
    }

    // Specs / Attributes extraction (Table)
    if (config.specsSelector) {
        const table = $(config.specsSelector).first();
        if (table.length > 0) {
            // We look for tr blocks
            table.find('tr').each((_, tr) => {
                const tds = $(tr).find('td, th');
                if (tds.length >= 2) {
                    const key = $(tds[0]).text().trim();
                    const val = $(tds[1]).text().trim();
                    if (key && val) {
                        result.attributes[key] = val;
                    }
                }
            });
        }
    }

  } catch (err) {
    console.error(`[DeepScraper] Error scraping ${url}:`, err);
    throw err;
  } finally {
    await browser.close();
  }

  return result;
}
