const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-9000-btu-wifi-inclus-lampa-uv-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // find the real price-new element
    const properPrice = $('.price-new').first().parent().parent().parent().attr('class') || $('.price-new').first().parent().attr('class');
    
    // find the h1 product title container
    const h1Container = $('h1').parent().attr('class');
    
    console.log("price-new parent class:", properPrice);
    console.log("h1 parent class:", h1Container);
})
.catch(console.error);
