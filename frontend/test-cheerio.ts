import * as cheerio from 'cheerio';
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

const html = `<p class="price"><del aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi>10,00&nbsp;<span class="woocommerce-Price-currencySymbol">lei</span></bdi></span></del> <span class="screen-reader-text">Prețul inițial a fost: 10,00&nbsp;lei.</span><ins aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi>9,20&nbsp;<span class="woocommerce-Price-currencySymbol">lei</span></bdi></span></ins><span class="screen-reader-text">Prețul curent este: 9,20&nbsp;lei.</span></p>`;
const $ = cheerio.load(html);
const text = $('p.price').text();
console.log("Cheerio Text:", text);
console.log("Parsed Price:", parsePrice(text));
