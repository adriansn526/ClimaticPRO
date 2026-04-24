const cheerio = require('cheerio');

async function test() {
    try {
        const url = "https://eurocool.ro/produs/aparat-de-aer-conditionat-mitsubishi-electric-msz-hr50vfk-18000-btu-inverter-r32-wi-fi/";
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);
           
        const priceHtml = $('p.price').html();
        const priceText = $('p.price').text();
           
        console.log("Raw HTML inside p.price:\n", priceHtml);
        console.log("Text content of p.price:\n", priceText);
        
    } catch(e) {
        console.log(e);
    }
}
test();
