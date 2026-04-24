const cheerio = require('cheerio');

async function check() {
  const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
  try {
      // Add fake headers so we look like a real browser
      const res = await fetch(url, { 
          headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
              "Accept-Language": "en-US,en;q=0.9,ro;q=0.8"
          } 
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      console.log("Analyzing Vexio classes:");
      let priceCandidates = [];
      $('*').each((i, el) => {
          let t = $(el).text().trim().toLowerCase();
          // We look for any text displaying ~1650 lei
          if (t.includes('1650') || t.includes('1.650') || t.includes('1,650')) {
             if($(el).children().length <= 1) {
                 const id = $(el).attr('id') || '';
                 const cls = $(el).attr('class') || '';
                 priceCandidates.push(`<${el.name} id="${id}" class="${cls}"> ${t.substring(0, 30)}`);
             }
          }
      });
      
      console.log([...new Set(priceCandidates)].join('\n'));
      
      console.log("\nWhat has .price but not empty?");
      $('*[class*="price"]').each((i, el) => {
          if($(el).children().length === 0) {
              console.log($(el).attr('class'), " -> ", $(el).text().trim().substring(0, 30));
          }
      });
      
      console.log("\nWhat has stock classes?");
      $('*[class*="stock"], *[class*="stoc"], *[class*="avail"]').each((i, el) => {
          if($(el).children().length <= 1) {
              console.log($(el).attr('class'), " -> ", $(el).text().trim().substring(0, 30));
          }
      });
      
  } catch (e) {
      console.log(e);
  }
}
check();
