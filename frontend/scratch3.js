const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://eurocool.ro/produs/aparat-aer-conditionat-aux-q-series-18-000-btu-h-asw-h18b5b4-qcr3di-c0-wifi-inclus-sleep-mode-auto-curatare-auto-restart-filtru-carbon-activ/')
.then(response => {
    const $ = cheerio.load(response.data);
    
    const stockEl = $('p.stock.in-stock.wd-style-bordered');
    const addToCart = $('button.single_add_to_cart_button');
    const outOfStock = $('.out-of-stock');
    console.log("p.stock.in-stock.wd-style-bordered length:", stockEl.length);
    console.log("button.single_add_to_cart_button length:", addToCart.length);
    console.log(".out-of-stock length:", outOfStock.length);
    console.log("body class:", $('body').attr('class'));
})
.catch(console.error);
