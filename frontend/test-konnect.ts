import * as cheerio from 'cheerio';

async function test() {
    const res = await fetch('https://konnect-shop.ro/aer-conditionat/aparat-aer-conditionat-daikin-sensira-c-12000-btu-wi-fi-ftxc35e-rxc35e', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
    });
    const text = await res.text();
    const $ = cheerio.load(text);
    
    console.log("Found classes related to price:");
    $('*[class*="price"]').each((_, el) => {
        console.log($(el).attr('class'), "->", $(el).text().trim());
    });
}
test().catch(console.error);
