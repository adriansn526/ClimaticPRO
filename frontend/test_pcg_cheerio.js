const { HttpsProxyAgent } = require('https-proxy-agent');
const cheerio = require('cheerio');

async function testPCGarage() {
    const proxyUrl = 'http://brd-customer-hl_84a2f091-zone-climatic_residential_proxy1:rp8n9mk1zqrb@brd.superproxy.io:22225';
    const agent = new HttpsProxyAgent(proxyUrl);
    
    console.log("Fetching PC Garage with residential proxy...");
    try {
        const res = await fetch('https://www.pcgarage.ro/aer-conditionat/', {
            agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        
        console.log("Status:", res.status);
        const html = await res.text();
        console.log("HTML length:", html.length);
        
        if (html.includes('Cloudflare') || html.includes('cf-browser-verification')) {
            console.log("WARNING: Hit Cloudflare challenge.");
        }
        
        const $ = cheerio.load(html);
        const products = [];
        
        $('.product_box').each((i, el) => {
            const title = $(el).find('.pb-name a').text().trim() || $(el).find('.name a').text().trim() || $(el).find('a').attr('title');
            const link = $(el).find('.pb-name a').attr('href') || $(el).find('a').attr('href');
            const price = $(el).find('.pb-price').text().trim() || $(el).find('.price').text().trim();
            products.push({ title, link, price });
        });
        
        console.log("Found products:", products.slice(0, 5));
        
        // Also log some generic classes if none found
        if (products.length === 0) {
           console.log("No .product_box found. Let's find common classes:");
           const classes = {};
           $('[class]').each((i, el) => {
               const c = $(el).attr('class');
               if (c) {
                   c.split(' ').forEach(cls => {
                       classes[cls] = (classes[cls] || 0) + 1;
                   });
               }
           });
           const sorted = Object.entries(classes).sort((a,b) => b[1] - a[1]).slice(0, 20);
           console.log(sorted);
        }
        
    } catch (e) {
        console.error(e);
    }
}
testPCGarage();
