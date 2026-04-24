const cheerio = require('cheerio');

async function check() {
  const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
  try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $('h1').text().trim();
      console.log('Title:', title);

      // Go up a few levels from H1 to find the likely root product container
      let root = $('h1');
      for(let i=0; i<5; i++) {
          root = root.parent();
          if (root.find('.price').length > 0) {
              break;
          }
      }
      
      console.log("Found common root? classes:", root.attr('class'), "id:", root.attr('id'));
      
      const prices = root.find('.price, .special-price');
      prices.each((i, el) => {
          console.log(`Price #${i} text:`, $(el).text().trim().replace(/\s+/g, ' '));
          
          let curr = $(el);
          let path = [];
          for(let p=0; p<4; p++) {
             if (curr.length && curr[0].name) {
                 path.push(`${curr[0].name}${curr.attr('id') ? '#'+curr.attr('id') : ''}${curr.attr('class') ? '.'+curr.attr('class').split(' ').join('.') : ''}`);
                 curr = curr.parent();
             }
          }
          console.log(`  Path: ${path.reverse().join(' > ')}`);
      });

  } catch (e) {
      console.log(e);
  }
}
check();
