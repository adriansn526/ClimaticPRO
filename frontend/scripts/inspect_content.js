
const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getPostContent() {
  const query = `
    query GetPost {
      post(id: "ce-este-seer-si-scop-in-sistemele-de-climatizare-si-aere-conditionate", idType: SLUG) {
        id
        slug
        title
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

getPostContent();
