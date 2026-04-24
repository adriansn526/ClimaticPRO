const cheerio = require('cheerio');

async function check() {
  const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
  try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const $ = cheerio.load(html);

      console.log("Checking elements holding the word 'stoc':");
      $('*').each((i, el) => {
         const txt = $(el).text().trim().toLowerCase();
         if (txt.includes('stoc') && txt.length < 50 && !txt.includes('.js')) {
             console.log(`Element: <${el.tagName}> ID: ${$(el).attr('id') || '*'} Class: ${$(el).attr('class') || '*'}`);
             console.log(`Text: ${txt.replace(/\s+/g, ' ')}\n`);
         }
      });
      
      console.log("Checking elements with itemprop=availability:");
      $('[itemprop="availability"]').each((i, el) => {
          console.log(`Element: ${$(el).attr('class')} , content: ${$(el).attr('content')} or text: ${$(el).text()}`);
      });
  } catch (e) {
      console.log(e);
  }
}
check();
