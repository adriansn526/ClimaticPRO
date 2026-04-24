const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://konnect-shop.ro/aer-conditionat/aparat-de-aer-conditionat-midea-xtreme-fresh-msagbu-12hrfn8-qrd1gw-mox133-12hfn8-qrd1gw')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Find all elements matching the word "lei" (case insensitive)
    const elements = $('*:contains("Lei"), *:contains("lei")').filter(function() {
        return $(this).children().length === 0;
    });
    
    let results = [];
    elements.each((i, el) => {
        results.push({html: $(el).html(), class: $(el).attr('class')});
    });
    
    console.log(results);
})
.catch(console.error);
