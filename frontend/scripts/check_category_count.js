
const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function checkCount() {
    const query = `
    query GetCount {
    products(first: 10, where: { categoryIn: ["aer-conditionat-rezidential"] }) {
      found
      nodes {
          name
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
        if (json.errors) console.error(json.errors);
        console.log("Total Products in Rezidential (found):", json.data?.products?.found);
        console.log("Total Products in Rezidential (pageInfo):", json.data?.products?.pageInfo?.total);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCount();
