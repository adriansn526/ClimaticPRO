import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
// @ts-ignore
import { isPlainObject } from 'is-plain-object';

// Apply the stealth plugin to avoid basic bot detections (Cloudflare, etc.)
puppeteer.use(StealthPlugin());

export interface ScraperConfig {
  catalogUrls: string[];
  productLinkSelector: string;
  paginationSelector?: string;
  priceSelector: string;
  titleSelector: string;
  stockSelector?: string;
  customProvider?: string;
  regionalStockLocation?: string;
  useProxy?: boolean;
}

export interface ScrapedResult {
  url: string;
  title: string;
  price: number;
  stock: 'in_stock' | 'out_of_stock' | string;
}

/**
 * Extracts numeric value from a price string (e.g. "1.200,99 Lei" -> 1200.99)
 */
function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  
  // E-commerce platforms like WooCommerce often inject 4-5 duplicate prices + screen-reader text inside p.price 
  // We extract all valid numeric price chunks using regex
  const matches = priceStr.match(/\d+(?:[.,]\d+){0,2}/g);
  if (!matches || matches.length === 0) return 0;

  const validPrices: number[] = [];
  for (let str of matches) {
      str = str.replace(/^[.,]+|[.,]+$/g, ''); // strip trailing dots
      let normalized = str;
      const lastCommaIndex = str.lastIndexOf(',');
      const lastDotIndex = str.lastIndexOf('.');

      if (lastCommaIndex > lastDotIndex) {
        normalized = str.replace(/\./g, '').replace(',', '.'); // EUR/RO format: 5.000,99
      } else if (lastDotIndex > lastCommaIndex) {
        normalized = str.replace(/,/g, ''); // US format: 5,000.99
      }
      
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0) {
          validPrices.push(num);
      }
  }

  if (validPrices.length === 0) return 0;

  // Eliminate tiny auxiliary numbers (e.g. "1" rate, "2" years warranty) that got accidentally sucked in
  const maxPrice = Math.max(...validPrices);
  const legitimatePrices = validPrices.filter(p => validPrices.length === 1 || p > (maxPrice * 0.1));
  
  if (legitimatePrices.length > 0) {
      // In ecommerce, if there are multiple prices inside the block, the lowest one is the Sale Price.
      return Math.min(...legitimatePrices);
  }
  
  return validPrices[0];
}

export async function runUniversalScraper(config: ScraperConfig): Promise<ScrapedResult[]> {
  const args = [
       '--no-sandbox', 
       '--disable-setuid-sandbox', 
       '--disable-dev-shm-usage',
       '--disable-gpu',
       '--no-zygote',
       '--single-process',
       '--ignore-certificate-errors'
  ];

  if (config.useProxy && process.env.SCRAPER_PROXY_URL) {
      args.push(`--proxy-server=${process.env.SCRAPER_PROXY_URL}`);
  }

  const browser = await puppeteer.launch({
    headless: true, // Use headless=true in production backend
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: args
  });

  const discoveredProductUrls = new Set<string>();
  const finalResults: ScrapedResult[] = [];

  try {
    const page = await browser.newPage();
    
    if (config.useProxy && process.env.SCRAPER_PROXY_USER && process.env.SCRAPER_PROXY_PASS) {
        await page.authenticate({
            username: process.env.SCRAPER_PROXY_USER,
            password: process.env.SCRAPER_PROXY_PASS,
        });
    }

    // Maximize viewport trick
    await page.setViewport({ width: 1920, height: 1080 });
    // Useful to masquerade as normal browser headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8'
    });

    // -------------------------------------------------------------
    // PHASE 1: DISCOVERY (Crawl Catalogs mapping all Product links)
    // -------------------------------------------------------------
    for (const catalogUrl of config.catalogUrls) {
      if (!catalogUrl.trim()) continue;

      let currentPage = catalogUrl;
      let hasNextPage = true;

      while (hasNextPage && currentPage) {
        console.log(`[Scraper] Discovering catalog: ${currentPage}`);
        
        try {
          await page.goto(currentPage, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
          console.warn(`[Scraper] Timeout or error loading catalog ${currentPage}`, e);
          break; // move to next url if dead
        }

        // We can wait briefly to ensure dynamic elements render, but Cheerio will just parse what's there
        // If it's React/Vue SPA, we wait for the product Link selector to appear
        try {
          await page.waitForSelector(config.productLinkSelector, { timeout: 5000 });
        } catch (e) {
          // If no items found immediately, maybe it's just slow, or empty. We proceed anyway.
        }

        let isLoadMoreAJAX = false;

        // AJAX LOAD MORE Logic (Infinite Scroll/Click)
        if (config.paginationSelector) {
          try {
             const hasHref = await page.evaluate((sel: string) => {
                 const el = document.querySelector(sel);
                 return el ? el.hasAttribute('href') : false;
             }, config.paginationSelector);

             if (!hasHref) {
                 isLoadMoreAJAX = true;
                 console.log("[Scraper] Detected AJAX Load More Button.");
                 let clickAttempts = 0;
                 while(clickAttempts < 100) { // Safety limit of 100 pages per catalog
                     try {
                          const loadMoreBtn = await page.$(config.paginationSelector);
                          if (!loadMoreBtn) break;
                          
                          // Proceed to click if visible
                          const isVisible = await loadMoreBtn.evaluate(b => {
                              const style = window.getComputedStyle(b);
                              return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                          });
                          if (!isVisible) break;

                          await loadMoreBtn.click();
                          await new Promise(r => setTimeout(r, 2000)); // wait for network loading
                          clickAttempts++;
                     } catch(e) {
                          break; // button disappeared or is unclickable
                     }
                 }
             }
          } catch(err) {
              console.log("[Scraper] Error evaluating pagination.", err);
          }
        }

        const html = await page.content();
        const $ = cheerio.load(html);

        // Map Product Links
        const itemLinks = $(config.productLinkSelector);
        if (itemLinks.length === 0) {
          console.log(`[Scraper] No products found at ${currentPage} using selector ${config.productLinkSelector}.`);
          break; // No products found, kill loop
        }

        itemLinks.each((_, el) => {
          let href = $(el).attr('href');
          if (href) {
            // resolve relative URLs
            if (href.startsWith('/')) {
              const urlObj = new URL(currentPage);
              href = `${urlObj.origin}${href}`;
            }
            discoveredProductUrls.add(href);
          }
        });

        // Pagination Logic
        hasNextPage = false;
        if (!isLoadMoreAJAX && config.paginationSelector) {
          const nextBtn = $(config.paginationSelector).first();
          if (nextBtn.length > 0) {
            let nextHref = nextBtn.attr('href');
            if (nextHref) {
              if (nextHref.startsWith('/')) {
                const urlObj = new URL(currentPage);
                nextHref = `${urlObj.origin}${nextHref}`;
              }
              // Only continue if the link actually changed to prevent infinite loops
              if (nextHref && nextHref !== currentPage) {
                currentPage = nextHref;
                hasNextPage = true;
                
                // Be polite to the server
                await new Promise(r => setTimeout(r, 1500));
              }
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 2: DATA EXTRACTION (Deep Crawl into unique Single Pages)
    // -------------------------------------------------------------
    console.log(`[Scraper] Found ${discoveredProductUrls.size} unique products. Extracting details...`);
    
    // We navigate sequentially to not blow up RAM. If we wanted fast: use p-limit or Promise.all batches.
    for (const prodUrl of Array.from(discoveredProductUrls)) {
      try {
        console.log(`[Scraper] Scraping Single Product: ${prodUrl}`);
        await page.goto(prodUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        try {
          // wait until at least title exists
          await page.waitForSelector(config.titleSelector, { timeout: 5000 });
        } catch(e) {}

        const html = await page.content();
        const $ = cheerio.load(html);

        const titleText = $(config.titleSelector).first().text().trim();
        const priceText = $(config.priceSelector).first().text().trim();
        
        // Stock Logic
        let stockStatus: string = 'in_stock';
        
        // --- CUSTOM PROVIDER HOOKS ---
        if (config.customProvider === 'altex' && config.regionalStockLocation) {
            console.log(`[Altex API] Analiză stoc regional pentru: ${config.regionalStockLocation}`);
            try {
               await page.waitForNetworkIdle({ idleTime: 500, timeout: 3000 }).catch(() => {});
               
               const pageText = await page.content();
               // Basic DOM check if we hit the Altex exact unavailable message for central hub
               const isOutOfStockCentral = pageText.toLowerCase().includes('indisponibil') || pageText.toLowerCase().includes('stoc epuizat') || pageText.toLowerCase().includes('rezerva in magazin');
               
               if (isOutOfStockCentral) {
                   // Hooking into Altex internal JSON format (or just scanning the DOM string representation if it rendered the modal)
                   // Usually the JSON is massive, but we can do a quick regex on the city name in vicinity of "stock", "qty"
                   // This is a simulated implementation placeholder for the custom script
                   
                   const loc = config.regionalStockLocation.toLowerCase();
                   
                   // Simplified simulation: If the page text literally contains the city name after clicking/loading
                   if (pageText.toLowerCase().includes(loc)) {
                       stockStatus = `PRELUARE PERSONALA (${config.regionalStockLocation})`;
                   } else {
                       stockStatus = 'out_of_stock';
                   }
               } else {
                   stockStatus = 'in_stock';
               }
            } catch(e) {
               console.warn("[Altex Hook] Failed checking regional stock", e);
               stockStatus = 'out_of_stock';
            }
        } 
        else if (config.stockSelector) {
           const stockEl = $(config.stockSelector).first();
           if (stockEl.length === 0) {
              // Heuristic for WooCommerce: If no stock badge, but "Add to cart" button exists, it's IN STOCK.
              const addToCartBtn = $('button[name="add-to-cart"], button.single_add_to_cart_button, .add_to_cart_button').first();
              if (addToCartBtn.length > 0) {
                  stockStatus = 'in_stock';
              } else {
                  stockStatus = 'out_of_stock'; // Bad assumption sometimes, but often missing badge AND missing add to cart = out of stock
              }
           } else {
              const stockText = stockEl.text().toLowerCase();
              if (stockText.includes('stoc') && !stockText.includes('indisponibil') && !stockText.includes('nu') && !stockText.includes('epuizat')) {
                stockStatus = 'in_stock';
              } else if (stockText.includes('out') || stockText.includes('epuizat') || stockText.includes('lipsa')) {
                stockStatus = 'out_of_stock';
              } else {
                stockStatus = 'in_stock';
              }
           }
        }

        if (titleText && priceText) {
          finalResults.push({
            url: prodUrl,
            title: titleText,
            price: parsePrice(priceText),
            stock: stockStatus
          });
        }
        
      } catch (err) {
        console.error(`[Scraper] Failed extracting ${prodUrl}`, err);
      }
      
      // Polite delay between products
      await new Promise(r => setTimeout(r, 800));
    }

  } catch (err) {
    console.error(`[Scraper] Fatal Engine Error:`, err);
  } finally {
    await browser.close();
  }

  return finalResults;
}

export async function enrichProductWithScraper(url: string): Promise<{ description: string, imageUrl: string | null }> {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
  const browser = await puppeteer.launch({ headless: true, args });
  let result = { description: '', imageUrl: null as string | null };
  try {
     const page = await browser.newPage();
     await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
     const html = await page.content();
     const $ = cheerio.load(html);
     
     // General heuristic for image
     let imgUrl = null;
     const imgCandidates = [
         $('meta[property="og:image"]').attr('content'),
         $('.product-image img, .product-gallery img, .MagicZoom img, #product-image img').first().attr('src'),
         $('.product-image img, .product-gallery img, .MagicZoom img, #product-image img').first().attr('data-src')
     ];
     for (const src of imgCandidates) {
         if (src && src.length > 5 && !src.includes('data:image')) {
             imgUrl = src;
             break;
         }
     }
     if (imgUrl && !imgUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imgUrl = imgUrl.startsWith('/') ? `${urlObj.origin}${imgUrl}` : `${urlObj.origin}/${imgUrl}`;
     }
     
     // General heuristic for description
     let description = '';
     const descSelectors = [
        '.product-description', '#description', '.tabs-panel', '[itemprop="description"]', '.product-details'
     ];
     for (const sel of descSelectors) {
         const el = $(sel);
         if (el.length > 0) {
             description = el.html() || '';
             // clean up script tags
             description = description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
             if (description.length > 50) break;
         }
     }
     
     result.imageUrl = imgUrl;
     result.description = description;

  } catch(e) {
      console.error("[Golden Enrich] Error scraping:", e);
  } finally {
      await browser.close();
  }
  return result;
}

