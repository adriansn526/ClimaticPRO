const puppeteer = require('puppeteer-core');

async function testScrape() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--proxy-server=http://brd.superproxy.io:33335',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  
  await page.authenticate({
    username: 'brd-customer-hl_84a2f091-zone-climaticpro_datacenter_proxy',
    password: 'jh4xzll9om5n'
  });

  console.log('Navigating to PC Garage...');
  
  try {
    await page.goto('https://www.pcgarage.ro/aer-conditionat/', { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    console.log('HTML Length:', html.length);
    
    // Dump page content to a file to analyze selectors
    const fs = require('fs');
    fs.writeFileSync('pcgarage_dump.html', html);
    
    // Check Cloudflare block
    if (html.includes('Cloudflare') || html.includes('cf-browser-verification')) {
       console.log('Cloudflare blocked us.');
    }
    
    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.product_box'));
      if (items.length === 0) {
        // try alternatives
        const altItems = Array.from(document.querySelectorAll('.product-box, .product'));
        return altItems.map(item => ({ title: item.className })).slice(0, 5);
      }
      return items.map(item => {
        const titleEl = item.querySelector('.pb-name a') || item.querySelector('.name a');
        const priceEl = item.querySelector('.pb-price') || item.querySelector('.price');
        return {
          title: titleEl ? titleEl.textContent.trim() : null,
          url: titleEl ? titleEl.href : null,
          price: priceEl ? priceEl.textContent.trim() : null
        };
      }).slice(0, 5);
    });
    
    console.log('Test parsed products:', products);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

testScrape();
