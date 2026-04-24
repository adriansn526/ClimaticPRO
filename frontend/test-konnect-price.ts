import * as cheerio from 'cheerio';

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

async function test() {
    const url = 'https://konnect-shop.ro/aer-conditionat/aparat-aer-conditionat-daikin-sensira-c-12000-btu-wi-fi-ftxc35e-rxc35e';
    const res = await fetch(url);
    const html = await res.text();
    
    const $ = cheerio.load(html);
    
    const selectors = ['.price-normal', '.price-new', '.price'];
    
    for (const sel of selectors) {
        const el = $(sel);
        if (el.length > 0) {
            console.log(`\nFound with selector: ${sel}`);
            console.log(`Num elements: ${el.length}`);
            el.each((i, e) => {
                const text = $(e).text().trim();
                console.log(`Element ${i} raw text: "${text}"`);
                console.log(`Parsed price: ${parsePrice(text)}`);
            });
        }
    }
    
    // Original scraper behavior is $(config.priceSelector).first().text().trim()
    console.log('\n--- Original Scraper Logic ---');
    const combinedSelector = '.price-normal, .price-new, .price';
    const firstText = $(combinedSelector).first().text().trim();
    console.log(`First matching raw text: "${firstText}"`);
    console.log(`Parsed final price: ${parsePrice(firstText)}`);
}

test().catch(console.error);
