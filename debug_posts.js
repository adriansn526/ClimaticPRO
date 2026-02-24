

const WORDPRESS_API_URL = 'https://cms.climaticpro.ro/graphql';

async function getPosts() {
  const query = `
    query GetPosts {
      posts(first: 5) {
        nodes {
          title
          excerpt
          content
          featuredImage {
            node {
              sourceUrl
            }
          }
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
  } catch (error) {
    console.error('Error:', error);
  }
}

getPosts();
