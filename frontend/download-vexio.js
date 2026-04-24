const fs = require('fs');

async function testConfig() {
   const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
   const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
   const html = await res.text();
   fs.writeFileSync('vexio-sample.html', html);
   console.log("Written HTML. Length: ", html.length);
}
testConfig();
