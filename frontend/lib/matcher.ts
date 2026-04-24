import stringSimilarity from 'string-similarity';

export interface ScrapedProductData {
  title: string;
  price: number;
  stock: string; // 'in_stock' or 'out_of_stock'
  url: string;
}

export interface InternalProductParams {
  id: number;
  name: string;
  sku?: string | null;
}

export interface MatchResult {
  matchedProductId: number | null;
  suggestedProductId: number | null;
  score: number;
}

export function fuzzyMatchProduct(
  externalTitle: string | undefined, 
  dbProducts: InternalProductParams[],
  threshold: number = 0.95
): MatchResult {
  if (!externalTitle || dbProducts.length === 0) {
    return { matchedProductId: null, suggestedProductId: null, score: 0 };
  }

  // Helpers string extraction
  const sanitize = (str: string) => str.toLowerCase().replace(/[\s\-_]+/g, ' ').replace(/[^\w\s]/g, '').trim();
  
  const extractBtu = (str: string) => {
     // prinde 9000, 12000, 18000, etc. din string-ul normalizat sau brut
     const m = str.match(/\b(9000|12000|18000|24000|32000|42000|48000|60000)\b/);
     return m ? m[1] : null;
  };

  const extractModelCode = (str: string) => {
     // Looks for complex alnums like GWH12AGB-K6DNA1A or MSAGBU-12HRFNX
     const upperStr = str.toUpperCase();
     const matches = upperStr.match(/\b[A-Z0-9\-]{8,}\b/g); 
     if (matches) {
       // Only return codes that contain BOTH letters and numbers, excluding standard words
       return matches.find(m => /[A-Z]/.test(m) && /[0-9]/.test(m) && !m.includes('BTU'));
     }
     return null;
  };
  
  const cleanExternal = sanitize(externalTitle);
  const extBtu = extractBtu(cleanExternal);
  const extCode = extractModelCode(externalTitle);

  let bestMatchIndex = -1;
  let bestRating = -1;

  for (let i = 0; i < dbProducts.length; i++) {
     const p = dbProducts[i];
     const cleanInternal = sanitize(p.name);
     
     // 1. Semantic Veto: BTU Check
     // Daca extragem BTU clar din ambele, iar ele difera, blocam! (ex: oprit a mapa 24000 pe 12000)
     const intBtu = extractBtu(cleanInternal);
     if (extBtu && intBtu && extBtu !== intBtu) {
        continue;
     }

     // 2. Semantic Veto: Factory Code (SKU) Check
     let intCode = p.sku ? extractModelCode(p.sku) : null;
     if (!intCode) intCode = extractModelCode(p.name);

     let skuBoost = 0;
     if (extCode && intCode) {
        // Ex: extCode="GWH24AGD-K6DNA1C" vs intCode="GWH12AGB-K6DNA1A"
        const skuSim = stringSimilarity.compareTwoStrings(extCode, intCode);
        if (skuSim < 0.6) {
            continue; // Codurile difera structural
        }
        if (skuSim > 0.9) {
            skuBoost = 0.20; // Boost masiv de 20% dacă aparatul e literalmente același cod!
        }
     }

     // Apply classical similarity on the remaining valid candidates
     let rating = stringSimilarity.compareTwoStrings(cleanExternal, cleanInternal);
     rating = Math.min(1.0, rating + skuBoost); // Aplică boost-ul, limitat la 100%
     
     if (rating > bestRating) {
         bestRating = rating;
         bestMatchIndex = i;
     }
  }

  if (bestMatchIndex === -1) {
    return { matchedProductId: null, suggestedProductId: null, score: 0 };
  }

  const bestProductId = dbProducts[bestMatchIndex].id;
  
  if (bestRating >= threshold) {
    return {
      matchedProductId: bestProductId,
      suggestedProductId: bestProductId,
      score: bestRating
    };
  }

  return { 
    matchedProductId: null, 
    suggestedProductId: bestProductId,
    score: bestRating 
  };
}
