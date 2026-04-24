const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    const text = $('.product-price, .price-new, .price').first().text().trim();
    console.log("FIRST MATCH:", text);
})
.catch(console.error);
