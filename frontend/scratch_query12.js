const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-9000-btu-wifi-inclus-lampa-uv-msagau-09hrfn8-qrd1gw-mox133-09hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Remove carousels
    $('.product-grid, .side-products').remove();
    
    const contentHtml = $('#content').html();
    const $content = cheerio.load(contentHtml);
    
    // find all elements with 'Lei' inside #content
    const leiEls = $content('*:contains("Lei"), *:contains("lei")').filter(function() { return $content(this).children().length === 0; });
    
    let results = [];
    leiEls.each((i, el) => {
        results.push({ tag: el.tagName, class: $content(el).attr('class'), text: $content(el).text().trim() });
    });
    
    console.log(results);
})
.catch(console.error);
