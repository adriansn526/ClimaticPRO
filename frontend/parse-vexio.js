const fs = require('fs');
const cheerio = require('cheerio');

async function parse() {
    const html = fs.readFileSync('/tmp/vex-proxy.html', 'utf-8');
    const $ = cheerio.load(html);
    
    // Extragem toate textele care contin "lei"
    console.log("=== PRICE ANALYSIS ===");
    // Gasim ce variante de prețuri apar pe pagină și ce clase au părinții lor (mai specific, containerul principal de preț)
    let pricesFound = [];
    $('*').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        // Cautam un text scurt, fix "1.650 lei" sau numere similare (Midea era 1650 in poza, e posibil sa se fi scumpit)
        if(text.includes('lei') && text.length < 25 && text.match(/\d/)) {
            // Check if it's the exact element (no children containing multiple leis)
            if ($(el).children().length <= 1) {
                let pClass = $(el).attr('class') || '';
                let id = $(el).attr('id') || '';
                pricesFound.push(`${text} | <${el.tagName} class="${pClass}" id="${id}">`);
            }
        }
    });
    
    // Deduplicate and log
    console.log([...new Set(pricesFound)].join('\n'));

    console.log("\n=== STOCK ANALYSIS ===");
    let stockFound = [];
    $('*').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        if((text.includes('stoc') || text.includes('indisponibil') || text.includes('availability') || text.includes('epuizat')) && text.length < 40) {
             if ($(el).children().length <= 1) {
                let pClass = $(el).attr('class') || ''; 
                stockFound.push(`${text} | <${el.tagName} class="${pClass}">`);
             }
        }
    });
    console.log([...new Set(stockFound)].slice(0, 15).join('\n'));
    
    console.log("\n=== H1 ANALYSIS ===");
    console.log("H1 text:", $('h1').text().trim(), "Class:", $('h1').attr('class'));
    
    // Print classes surrounding the h1 to understand main container
    let mainCont = $('h1').parent().parent();
    console.log("Main container IDs/Classes:", mainCont.attr('id'), mainCont.attr('class'));
    
    // Look closely at elements matching itemprop="price"
    console.log("\n=== ITEMPROP PRICE ===");
    console.log($('[itemprop="price"]').length, "elements found.");
    $('[itemprop="price"]').each((i, el) => {
        console.log(`- Element ${i}: content='${$(el).attr('content')}', text='${$(el).text().trim()}', class='${$(el).attr('class')}'`);
    });
}
parse();
