const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    const text = $('.product-price, .price-new, .price').first().text().trim();
    console.log("FIRST MATCH 9000 BTU:", text);
})
.catch(console.error);
