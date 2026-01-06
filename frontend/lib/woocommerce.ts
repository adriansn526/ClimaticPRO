export interface WooCommerceCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  image?: {
    sourceUrl: string;
  };
  children?: {
    nodes: WooCommerceCategory[];
  };
}

export interface WooCommerceProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  onSale: boolean;
  featured: boolean;
  stockStatus: string;
  stockQuantity?: number | null;
  manageStock?: boolean;
  sku?: string;
  description?: string;
  shortDescription?: string;
  image: {
    sourceUrl: string;
    altText: string;
  } | null;
  galleryImages?: {
    nodes: {
      sourceUrl: string;
      altText: string;
    }[];
  };
  productCategories?: {
    nodes: {
      name: string;
      slug: string;
    }[];
  };
  allPaBrand?: {
    nodes: {
      id: string;
      name: string;
      slug: string;
    }[];
  };
  attributes?: {
    nodes: {
      name: string;
      label?: string;
      options: string[];
      variation?: boolean;
    }[];
  } | null;
}

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/graphql';

export async function getProductBySlug(slug: string): Promise<WooCommerceProduct | null> {
  const query = `
    query GetProductBySlug($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        id
        databaseId
        name
        slug
        description(format: RAW)
        onSale
        featured
        image {
          sourceUrl
          altText
        }
        galleryImages {
          nodes {
            sourceUrl
            altText
          }
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockStatus
          stockQuantity
          manageStock
          sku
          shortDescription
          attributes {
            nodes {
              name
              label
              options
              variation
            }
          }
          productCategories {
            nodes {
              name
              slug
            }
          }
          allPaBrand {
            nodes {
              name
              slug
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
      body: JSON.stringify({ 
        query,
        variables: { slug }
      }),
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return null;
    }
    
    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return null;
    }
    
    return json.data?.product || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getFeaturedProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
  const query = `
    query GetFeaturedProducts {
      products(first: ${limit}, where: { featured: true }) {
        nodes {
          id
          databaseId
          name
          slug
          onSale
          featured
          image {
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            stockQuantity
            manageStock
            sku
            shortDescription
            attributes {
              nodes {
                name
                label
                options
                variation
              }
            }
            productCategories {
              nodes {
                name
                slug
              }
            }
            allPaBrand {
              nodes {
                name
                slug
              }
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
      next: { revalidate: 60 }, // ISR 1 minute
    });
    
    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return [];
    }
    
    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }
    
    const products = json.data?.products?.nodes || [];
    console.log(`Loaded ${products.length} featured products from WooCommerce`);
    
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function searchProducts(searchQuery: string): Promise<WooCommerceProduct[]> {
  const query = `
    query SearchProducts($search: String!) {
      products(first: 10, where: { search: $search }) {
        nodes {
          id
          databaseId
          name
          slug
          image {
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            sku
            attributes {
              nodes {
                name
                label
                options
              }
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
      body: JSON.stringify({ 
        query,
        variables: { search: searchQuery }
      }),
      cache: 'no-store', // Don't cache search results
    });
    
    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return [];
    }
    
    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }
    
    return json.data?.products?.nodes || [];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

export async function getInstallationProducts(limit: number = 3): Promise<WooCommerceProduct[]> {
  const query = `
    query GetInstallationProducts {
      products(first: ${limit}, where: { featured: true, orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes {
          id
          databaseId
          name
          slug
          onSale
          featured
          image {
            sourceUrl
            altText
          }
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            sku
            shortDescription
            attributes {
              nodes {
                name
                label
                options
              }
            }
            productCategories {
              nodes {
                name
                slug
              }
            }
            allPaBrand {
              nodes {
                name
                slug
              }
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
      next: { revalidate: 300 }, // Cache 5 minutes
    });
    
    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return [];
    }
    
    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }
    
    return json.data?.products?.nodes || [];
  } catch (error) {
    console.error('Error fetching installation products:', error);
    return [];
  }
}

export async function getWooCommerceCategories(): Promise<WooCommerceCategory[]> {
  const query = `
    query GetProductCategories {
      productCategories(first: 50, where: { parent: 0 }) {
        nodes {
          id
          name
          slug
          count
          image {
            sourceUrl
          }
          children {
            nodes {
              id
              name
              slug
              count
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
      next: { revalidate: 600 }, // Cache 10 minutes
    });
    
    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }
    
    return json.data?.productCategories?.nodes || [];
  } catch (error) {
    console.error('Error fetching WooCommerce categories:', error);
    return [];
  }
}
