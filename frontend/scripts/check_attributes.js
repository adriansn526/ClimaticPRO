


const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getUsedAttributeSlugs(categorySlugs) {
  const categories = categorySlugs.map(s => `"${s}"`).join(', ');
  const query = `
    query GetUsedAttributes {
    products(first: 100, where: { categoryIn: [${categories}] }) {
        nodes {
          name
          ... on SimpleProduct {
            attributes {
              nodes {
              name
              options
                ... on GlobalProductAttribute {
                slug
              }
            }
          }
        }
      }
    }
  }
  `;

  console.log("Querying for:", categories);

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("Errors:", JSON.stringify(json.errors, null, 2));
      return { capacitySlugs: [], energySlugs: [] };
    }

    const products = json.data?.products?.nodes || [];
    console.log(`Found ${products.length} products`);

    const capacitySet = new Set();
    const energySet = new Set();

    products.forEach((p) => {
      p.attributes?.nodes?.forEach((attr) => {
        // Log all attributes to debug
        // console.log(`Attribute Found: Name="${attr.name}" Options=${JSON.stringify(attr.options)}`);

        if (attr.name === 'Capacitate' || attr.slug === 'pa_capacitate') {
          if (attr.options) attr.options.forEach((o) => capacitySet.add(o.toLowerCase().replace(/ /g, '-')));
        }

        // Broad check for energy
        if (attr.name.includes('Energ') || attr.name.includes('Clasa') || attr.slug?.includes('clasa') || attr.name === 'Clasa energetică') { // Added likely diacritic variation
          console.log(`MATCHED ENERGY: Name="${attr.name}" Slug="${attr.slug}" Options=${JSON.stringify(attr.options)}`);
          if (attr.options) attr.options.forEach((o) => energySet.add(o));
        }
      });
    });

    return {
      capacitySlugs: Array.from(capacitySet),
      energySlugs: Array.from(energySet)
    };
  } catch (error) {
    console.error(`Error: `, error);
    return { capacitySlugs: [], energySlugs: [] };
  }
}

async function check() {
  console.log("Checking Residential...");
  const rez = await getUsedAttributeSlugs(["aer-conditionat-rezidential", "split-de-perete"]);
  console.log("Result:", rez);
}

check();
