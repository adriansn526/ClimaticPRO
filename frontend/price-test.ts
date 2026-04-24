function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  const matches = priceStr.match(/\d+(?:[.,]\d+){0,2}/g);
  if (!matches || matches.length === 0) return 0;

  const validPrices: number[] = [];
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

console.log(parsePrice("18,00 lei 10,50 lei"));
console.log(parsePrice("18,00lei10,50lei"));
console.log(parsePrice("18001800,1050105"));
console.log(parsePrice("10001000,92092"));
