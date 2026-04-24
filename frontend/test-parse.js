function parsePrice(priceStr) {
  if (!priceStr) return 0;
  
  const matches = priceStr.match(/\d+(?:[.,]\d+){0,2}/g);
  if (!matches || matches.length === 0) return 0;

  const validPrices = [];
  for (let str of matches) {
      str = str.replace(/^[.,]+|[.,]+$/g, '');
      let normalized = str;
      const lastCommaIndex = str.lastIndexOf(',');
      const lastDotIndex = str.lastIndexOf('.');

      if (lastCommaIndex > lastDotIndex) {
        normalized = str.replace(/\./g, '').replace(',', '.'); 
      } else if (lastDotIndex > lastCommaIndex) {
        normalized = str.replace(/,/g, ''); 
      }
      
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0) {
          validPrices.push(num);
      }
  }

  if (validPrices.length === 0) return 0;

  const maxPrice = Math.max(...validPrices);
  const legitimatePrices = validPrices.filter(p => validPrices.length === 1 || p > (maxPrice * 0.1));
  
  if (legitimatePrices.length > 0) {
      return Math.min(...legitimatePrices);
  }
  
  return validPrices[0];
}

const inputs = [
  "5.000,00 lei Prețul inițial a fost: 5.000,00 lei.4.750,00 leiPrețul curent este: 4.750,00 lei.5.000,00 lei Prețul inițial a fost: 5.000,00 lei.4.750,00 leiPrețul curent este: 4.750,00 lei.",
  "8.000,00 lei Prețul inițial a fost: 8.000,00 lei", // hypotheticals
  "5.000005" // what if the crawler was ALREADY saving this somehow directly from the DB output without re-scraping?
];

inputs.forEach(i => console.log(i, "=>", parsePrice(i)));
