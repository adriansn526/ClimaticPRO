const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://eurocool.ro/produs/aparat-aer-conditionat-aux-q-series-18-000-btu-h-asw-h18b5b4-qcr3di-c0-wifi-inclus-sleep-mode-auto-curatare-auto-restart-filtru-carbon-activ/')
.then(response => {
    const $ = cheerio.load(response.data);
    
    // Look for anything containing "stoc"
    const elements = $('*:contains("Stoc")').filter(function() {
        return $(this).children().length === 0;
    });
    
    let results = [];
    elements.each((i, el) => {
        results.push($(el).parent().html().trim());
    });
    
    console.log(results);
})
.catch(console.error);
