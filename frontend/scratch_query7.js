const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-9000-btu-wifi-inclus-lampa-uv-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Look for product-info price
    const p1 = $('.product-info .product-price-group .price-new').text() || $('.product-info .product-price-group .price').text() || $('.product-info .price').text();
    const p2 = $('#product .price').text() || $('#product .product-price').text();
    const p3 = $('.product-right .price').text();
    const p4 = $('meta[itemprop="price"]').attr('content');
    
    console.log({ p1, p2, p3, p4 });
})
.catch(console.error);
