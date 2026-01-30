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

// Hardcoding internal URL to bypass persistent env var issue (climaticpro_wordpress_1)
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql';
console.log('WooCommerce API URL:', WORDPRESS_API_URL);

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

export async function getBestSellingProducts(limit: number = 4): Promise<WooCommerceProduct[]> {
  const query = `
    query GetBestSellingProducts {
      products(first: ${limit}, where: { orderby: { field: TOTAL_SALES, order: DESC } }) {
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
      next: { revalidate: 3600 }, // Cache 1 hour
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
    console.error('Error fetching best selling products:', error);
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

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  search?: string;
  brand?: string;
  orderby?: { field: string; order: string };
  after?: string;
  exclude?: number[];
}

export async function getProducts(filters: ProductFilters = {}, limit: number = 12): Promise<{ products: WooCommerceProduct[], pageInfo: any }> {
  const { category, minPrice, maxPrice, onSale, search, brand, orderby, after, exclude } = filters;

  // Construct filter arguments
  let whereArgs: string[] = [];
  if (category) whereArgs.push(`category: "${category}"`);
  if (minPrice) whereArgs.push(`minPrice: ${minPrice}`);
  if (maxPrice) whereArgs.push(`maxPrice: ${maxPrice}`);
  if (onSale) whereArgs.push(`onSale: true`);
  if (search) whereArgs.push(`search: "${search}"`);
  if (exclude && exclude.length > 0) whereArgs.push(`notIn: [${exclude.join(', ')}]`);

  // Add orderby
  const orderArgs = orderby
    ? `orderby: { field: ${orderby.field}, order: ${orderby.order} }`
    : `orderby: { field: DATE, order: DESC }`;

  const afterArg = after ? `, after: "${after}"` : '';

  // Taxonomy Filter for Brands
  let taxonomyFilter = '';
  if (brand) {
    taxonomyFilter = `, taxonomyFilter: { filters: [{ taxonomy: PA_BRAND, terms: ["${brand}"] }] }`;
  }

  const query = `
    query GetProducts {
      products(first: ${limit}${afterArg}, where: { ${whereArgs.join(', ')} ${taxonomyFilter} }, ${orderArgs}) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return { products: [], pageInfo: {} };
    }

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return { products: [], pageInfo: {} };
    }

    return {
      products: json.data?.products?.nodes || [],
      pageInfo: json.data?.products?.pageInfo || {}
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], pageInfo: {} };
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
      productCategories(first: 100, where: { hideEmpty: false }) {
        nodes {
          id
          databaseId
          name
          slug
          count
          image {
            sourceUrl
          }
          parent {
            node {
              id
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
      body: JSON.stringify({ query }),
      next: { revalidate: 600 }, // Cache 10 minutes
    });

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    const allNodes = json.data?.productCategories?.nodes || [];

    // Manual Tree Reconstruction
    const nodeMap = new Map<string, any>();
    const roots: any[] = [];

    // Initialize nodes with empty children array
    allNodes.forEach((node: any) => {
      node.children = { nodes: [] };
      nodeMap.set(node.slug, node);
    });

    // Build hierarchy
    allNodes.forEach((node: any) => {
      if (node.parent?.node?.slug && nodeMap.has(node.parent.node.slug)) {
        const parent = nodeMap.get(node.parent.node.slug);
        parent.children.nodes.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  } catch (error) {
    console.error('Error fetching WooCommerce categories:', error);
    return [];
  }
}

export interface WooCommerceBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brandImage?: string;
  count?: number;
}

export async function getAllBrands(): Promise<WooCommerceBrand[]> {
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
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    return json.data?.allPaBrand?.nodes || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}


export interface WooCommerceAttribute {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export async function getAllCapacitate(): Promise<WooCommerceAttribute[]> {
  const query = `
    query GetAllCapacitate {
      allPaCapacitate(first: 50, where: { hideEmpty: true, orderby: SLUG }) {
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
      next: { revalidate: 3600 },
    });

    const json = await response.json();
    if (json.errors) return [];
    return json.data?.allPaCapacitate?.nodes || [];
  } catch (error) {
    console.error('Error fetching capacitate:', error);
    return [];
  }
}

export async function getAllClasaEnergie(): Promise<WooCommerceAttribute[]> {
  const query = `
    query GetAllClasaEnergie {
      allPaClasaEnergie(first: 50, where: { hideEmpty: true, orderby: NAME }) {
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
      next: { revalidate: 3600 },
    });

    const json = await response.json();
    if (json.errors) return [];
    return json.data?.allPaClasaEnergie?.nodes || [];
  } catch (error) {
    console.error('Error fetching clasa energie:', error);
    return [];
  }
}

export async function getUsedAttributeSlugs(categories: string[]): Promise<{ capacitySlugs: string[], energySlugs: string[] }> {
  const categoryString = JSON.stringify(categories);
  const query = `
    query GetCategoryAttributes {
      products(first: 50, where: { categoryIn: ${categoryString} }) {
        nodes {
          ... on SimpleProduct {
            attributes {
              nodes {
                name
                options
              }
            }
          }
          ... on VariableProduct {
            attributes {
              nodes {
                name
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
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    });

    const json = await response.json();
    if (json.errors) return { capacitySlugs: [], energySlugs: [] };

    const products = json.data?.products?.nodes || [];
    const capacitySet = new Set<string>();
    const energySet = new Set<string>();

    products.forEach((p: any) => {
      p.attributes?.nodes?.forEach((attr: any) => {
        if (attr.name === 'pa_capacitate') {
          attr.options?.forEach((slug: string) => capacitySet.add(slug));
        }
        if (attr.name === 'pa_clasa-energie' || attr.name === 'pa_clasa_energie') {
          attr.options?.forEach((slug: string) => energySet.add(slug));
        }
      });
    });

    return {
      capacitySlugs: Array.from(capacitySet),
      energySlugs: Array.from(energySet)
    };
  } catch (error) {
    console.error(`Error fetching attributes for categories ${categories}:`, error);
    return { capacitySlugs: [], energySlugs: [] };
  }
}
