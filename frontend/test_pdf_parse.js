const pdfParse = require('pdf-parse/lib/pdf-parse.js');

let dataBuffer = fs.readFileSync('/home/asns/ClimaticPRO/docs/Furnizori/Daikin/1_LISTA PRET DAIKIN_AVI COMPACT_02.2026.pdf');

pdfParse(dataBuffer).then(function(data) {
    // print first 1500 chars to see the structure
    console.log(data.text.substring(0, 1500));
}).catch(console.error);
