
const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getAllClasaEnergie() {
    // The query used in woocommerce.ts
    const query = `
    query GetAllClasaEnergie {
      allPaClasaEnergie(first: 50) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `;

    try {
        const response = await fetch(WORDPRESS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();
        const nodes = json.data?.allPaClasaEnergie?.nodes || [];
        console.log("Global Energy Classes:", nodes.map(n => ({ name: n.name, slug: n.slug, count: n.count })));
    } catch (error) {
        console.error('Error:', error);
    }
}

getAllClasaEnergie();
