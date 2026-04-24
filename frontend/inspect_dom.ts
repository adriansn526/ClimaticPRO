import * as fs from 'fs';
import * as cheerio from 'cheerio';

const sites = [
  'https://www.melindainstal.ro/categorie/241/aer_conditionat_industrial_si_rezidential',
  'https://www.frigotehnie.ro/322-aer-conditionat',
  'https://aero-shop.ro/categorie-produs/aer-conditionat-rezidential/aer-conditionat/',
  'https://euro-instal.ro/aer-conditionat/2',
  'https://shop.ancopolar.ro/kategori/aer-conditionat/',
  'https://evofrost.ro/climatizare/aer-conditionat/'
];

async function run() {
  let results = '';

  for (const site of sites) {
    try {
      console.log(`Fetching ${site}...`);
      const response = await fetch(site, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const text = await response.text();
      const $ = cheerio.load(text);

      results += `\n\n==== SITE: ${site} ====\n\n`;

      // Extract general layout
      // Look for any grid, product, item classes
      // We will grab the first 3 links inside a product container
      
      const potentialProducts = $('div[class*="product"], div[class*="item"], li[class*="product"]');
      let found = 0;

      potentialProducts.each((i, el) => {
        if (found >= 2) return;
        const outer = $(el).clone();
        outer.find('svg, script, style').remove();
        
        // Only if it has a link and a price
        const text = outer.text().toLowerCase();
        if ($(el).find('a').length > 0 && (text.includes('lei') || text.includes('ron') || outer.text().match(/\d/))) {
            results += `[PRODUCT SNIPPET ${found + 1} CSS CLASSES: ${$(el).attr('class')}]\n`;
            results += outer.html()?.substring(0, 1500) + '\n\n';
            found++;
        }
      });
      
      if (found === 0) {
         results += "NO PRODUCTS FOUND. HTML SNAPSHOT:\n" + text.substring(0, 2000);
      }

    } catch(err: any) {
      console.error(`Failed ${site}:`, err.message);
      results += `\n\n==== SITE: ${site} FAILED ====\n${err.message}`;
    }
  }

  fs.writeFileSync('/tmp/doms.txt', results);
  console.log("Done analyzing DOMs. Open /tmp/doms.txt");
}

run();
