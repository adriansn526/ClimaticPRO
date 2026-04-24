const cheerio = require('cheerio');

async function check() {
  const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
  try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const $ = cheerio.load(html);

      // Find the main product container
      const h1Container = $('h1').parent().parent();
      console.log("H1 text is:", $('h1').text().trim());

      // Let's print out all unique classes associated to anything that looks like "lei"
      $('*').each((i, el) => {
         const txt = $(el).text().trim();
         if (txt.toLowerCase().includes('lei') && txt.length < 20) {
             console.log("Found short box with 'lei':", $(el).attr('class'), txt.replace(/\s+/g, ' '));
         }
      });
  } catch (e) {
      console.log(e);
  }
}
check();
