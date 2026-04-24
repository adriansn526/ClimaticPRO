const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://eurocool.ro/produs/aparat-aer-conditionat-portabil-aeg-chillflex-pro-12000-btu-awp35c3c1e-alb/') // Guessing the url
.then(response => {
    const $ = cheerio.load(response.data);
    const mainStock = $('.summary .out-of-stock, .entry-summary .out-of-stock').text();
    console.log("Main stock text:", mainStock);
})
.catch(console.error);
