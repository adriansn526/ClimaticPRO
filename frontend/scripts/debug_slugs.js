
const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getUsedAttributeSlugs(categorySlugs) {
    const query = `
    query GetUsedAttributes {
      products(first: 50, where: { categoryIn: ${JSON.stringify(categorySlugs)}, status: "PUBLISH" }) {
        nodes {
          ... on Product {
            attributes {
              nodes {
                 ... on GlobalProductAttribute {
                   id
                   name
                   slug
                   terms {
                      nodes {
                          slug
                          name
                      }
                   }
                 }
                 ... on LocalProductAttribute {
                   name
                   startOptions: options
                 }
              }
            }
          }
        }
      }
    }
  `;

    console.log("Querying for:", categorySlugs);

    try {
        const response = await fetch(WORDPRESS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();

        if (json.errors) {
            console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
            return;
        }

        const products = json.data?.products?.nodes || [];
        console.log(`Fetched ${products.length} products.`);

        const capacitySet = new Set();
        const energySet = new Set();

        products.forEach((p) => {
            const attrs = p.attributes?.nodes || [];
            attrs.forEach((attr) => {
                const name = attr.name?.toLowerCase() || '';
                const slug = attr.slug?.toLowerCase() || '';

                // Capacity Logic
                if (name === 'capacitate' || slug === 'pa_capacitate' || name.includes('btu')) {
                    // Prefer Global Terms Slugs if available
                    if (attr.terms?.nodes?.length > 0) {
                        attr.terms.nodes.forEach((t) => capacitySet.add(t.slug));
                    } else if (attr.startOptions) { // Local options
                        attr.startOptions.forEach((o) => capacitySet.add(o.toLowerCase().replace(/ /g, '-')));
                    }
                }

                // Energy Logic (Broad Matching)
                if (name.includes('clasa') && (name.includes('energ') || name.includes('ie'))) {
                    if (attr.terms?.nodes?.length > 0) {
                        attr.terms.nodes.forEach((t) => energySet.add(t.slug));
                    } else if (attr.startOptions) {
                        attr.startOptions.forEach((o) => {
                            energySet.add(o);
                            // Normalize "A++" -> "a-plus-plus" to match global slugs
                            energySet.add(o.toLowerCase().replace(/\+/g, '-plus').replace(/ /g, '-'));
                            // Also add simple "a++" just in case
                            energySet.add(o.toLowerCase());
                        });
                    }
                }
            });
        });

        console.log("Capacity Slugs Found:", Array.from(capacitySet));
        console.log("Energy Slugs Found:", Array.from(energySet));

    } catch (error) {
        console.error('Error fetching used attributes:', error);
    }
}

// Test with known category
getUsedAttributeSlugs(["aer-conditionat-rezidential"]);
