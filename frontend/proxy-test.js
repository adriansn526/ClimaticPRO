const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');

async function testVexio() {
    const proxyUrl = "http://brd-customer-hl_84a2f091-zone-climatic_residential_proxy1:rp8n9mk1zqrb@brd.superproxy.io:33335";
    const agent = new HttpsProxyAgent(proxyUrl);
    // disable ssl verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    try {
        const res = await fetch("https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/", {
            agent,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const html = await res.text();
        console.log("HTML fetched. Length:", html.length);
        
        const fs = require('fs');
        fs.writeFileSync('vexio-proxy.html', html);
        
        // Let's do a fast regex check for where the 1650 or 7253 price sits
        // Look for the class of elements holding something like "Lei"
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        console.log("Looking for Title block...");
        console.log("h1:", $('h1').text().trim());
        
        console.log("\nLooking for main price block...");
        $('*').each((i, el) => {
            const t = $(el).text().trim().toLowerCase();
            if (t.includes('1650') || t.includes('1.6') || t.includes('lei') || t.includes('7253')) {
                if ($(el).children().length <= 1 && t.length < 20) {
                     console.log(`Element: ${el.tagName}, class: ${$(el).attr('class')}, id: ${$(el).attr('id')}, text: ${t}`);
                     // Print tree path
                     let path = [];
                     let curr = $(el);
                     for(let j=0; j<4; j++) {
                         if(curr.length) {
                             path.push(`${curr[0].name}.${curr.attr('class')}`);
                             curr = curr.parent();
                         }
                     }
                     console.log("  ->", path.reverse().join(' > '));
                }
            }
        });

    } catch(e) {
        console.error(e);
    }
}
testVexio();
