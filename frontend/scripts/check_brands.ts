
const fetch = require('node-fetch');

const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getAllBrands() {
    const query = `
    query GetAllBrands {
    allPaBrand(first: 50, where: { hideEmpty: true }) {
        nodes {
        id
        name
        slug
        description
        brandImage
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
        return json.data?.allPaBrand?.nodes || [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
}

async function check() {
    console.log("Fetching brands...");
    const brands = await getAllBrands();
    console.log("Brands found:", brands.length);
    brands.forEach(b => {
        console.log(`ID: ${b.id}, Name: "${b.name}", Slug: "${b.slug}", Image: ${b.brandImage}`);
    });
}

check();
