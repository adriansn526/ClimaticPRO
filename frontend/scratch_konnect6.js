const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    let results = [];
    $('.product-price, .price-new, .price').each((i, el) => {
        results.push({ tag: el.tagName, class: $(el).attr('class'), text: $(el).text().trim().replace(/\s+/g, ' ') });
    });
    
    console.log(JSON.stringify(results, null, 2));
})
.catch(console.error);
