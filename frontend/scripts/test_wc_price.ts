async function checkPrices() {
    const WP_GRAPHQL_URL = 'https://cms.climaticpro.ro/graphql';
    const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `
                query GetProducts {
                    products(first: 5, where: {status: "publish"}) {
                        nodes {
                            name
                            ... on SimpleProduct {
                                price
                                regularPrice
                            }
                        }
                    }
                }
            `
        })
    });
    const json = await res.json();
    console.log(JSON.stringify(json.data.products.nodes, null, 2));
}

checkPrices();
