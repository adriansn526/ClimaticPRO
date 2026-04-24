const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-9000-btu-wifi-inclus-lampa-uv-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Find all .price and .price-new elements and log their tree paths
    const elements = $('.price-new, .price, .product-price');
    
    let results = [];
    elements.each((i, el) => {
        let path = [];
        let current = $(el);
        for(let j=0; j<5; j++) {
            if(!current || current.length === 0) break;
            const tag = current.get(0).tagName;
            const cls = current.attr('class') || '';
            const id = current.attr('id') || '';
            path.unshift(`${tag}${id ? '#'+id : ''}${cls ? '.'+cls.split(' ').join('.') : ''}`);
            current = current.parent();
        }
        results.push({ text: $(el).text().trim(), path: path.join(' > ') });
    });
    
    console.log(results);
})
.catch(console.error);
