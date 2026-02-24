
const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function checkLinks() {
    const query = `
    query GetLinks {
      posts(first: 1) {
        nodes {
          title
          slug
          link
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
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkLinks();
