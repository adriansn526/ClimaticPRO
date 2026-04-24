const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    const priceText1 = $('.product-price').html();
    const priceText2 = $('.price-new').html();
    const priceText3 = $('.price-old').html();
    console.log({ priceText1, priceText2, priceText3 });
})
.catch(console.error);
