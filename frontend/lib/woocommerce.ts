import { NextResponse } from 'next/server';
// Re-export or just use local function if defined in this file. 
// Actually getWooCommerceCategories is defined in this file below. We can hoist or just call it.
// It is defined at the bottom usually? No, let's check file.
// It is exported. We can call it directly.

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
      terms?: {
        nodes: {
          name: string;
          slug: string;
        }[];
      };
    }[];
  } | null;
  metaData?: {
    key: string;
    value: string;
  }[];
}

// Hardcoding internal URL to bypass persistent env var issue (climaticpro_wordpress_1)
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql';
console.log('WooCommerce API URL:', WORDPRESS_API_URL);

// Helper to replace old domain with new CMS domain recursively
function replaceUrlInObject(obj: any): any {
  if (typeof obj === 'string') {
    if (obj.includes('https://climaticpro.ro/wp-content/')) {
      return obj.replaceAll('https://climaticpro.ro/wp-content/', 'https://cms.climaticpro.ro/wp-content/');
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceUrlInObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = replaceUrlInObject(obj[key]);
    }
    return newObj;
  }

  return obj;
}

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
          metaData {
             key
             value
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
      next: { revalidate: 300 }, // ISR 5 minutes
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

    return replaceUrlInObject(json.data?.product || null);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductById(id: number): Promise<WooCommerceProduct | null> {
  const query = `
    query GetProductById($id: ID!) {
      product(id: $id, idType: DATABASE_ID) {
        id
        databaseId
        name
        slug
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
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
        variables: { id: String(id) }
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    const json = await response.json();
    return replaceUrlInObject(json.data?.product || null);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
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
            metaData {
              key
              value
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
      next: { revalidate: 3600 }, // ISR 1 hour
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

    // Filter out-of-stock products
    return replaceUrlInObject(products.filter((p: any) => p.stockStatus === 'IN_STOCK'));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function getBestSellingProducts(limit: number = 4): Promise<WooCommerceProduct[]> {
  const query = `
    query GetBestSellingProducts {
      products(first: 24, where: { orderby: { field: TOTAL_SALES, order: DESC } }) {
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

    const products = json.data?.products?.nodes || [];
    // Filter out-of-stock products and installation products
    const filteredProducts = products.filter((p: any) => 
      p.stockStatus === 'IN_STOCK' && 
      !p.name.toLowerCase().includes('instalar')
    );
    
    return replaceUrlInObject(filteredProducts.slice(0, limit));
  } catch (error) {
    console.error('Error fetching best selling products:', error);
    return [];
  }
}

export async function getProductsByIds(ids: number[]): Promise<WooCommerceProduct[]> {
  const query = `
    query GetProductsByIds($ids: [ID!]) {
      products(where: { in: $ids }) {
        nodes {
          id
          databaseId
          name
          slug
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
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
        variables: { ids: ids.map(String) }
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) return [];
    const json = await response.json();
    return replaceUrlInObject(json.data?.products?.nodes || []);
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }
}

export async function searchProducts(searchQuery: string): Promise<WooCommerceProduct[]> {
  const query = `
    query SearchProducts($search: String!) {
      products(first: 8, where: { search: $search }) {
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
            stockStatus
            sku
            attributes {
              nodes {
                name
                label
                options
              }
            }
            allPaBrand {
               nodes {
                 name
                 slug
               }
            }
          }
           ... on VariableProduct {
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

    return replaceUrlInObject(json.data?.products?.nodes || []);
  } catch (error) {

    console.error('Error searching products:', error);
    return [];
  }
}

export interface GetProductsParams {
  limit?: number;
  endCursor?: string;
  category?: string;     // Slug
  tag?: string;          // Slug
  slug?: string;         // Specific product slug
  onSale?: boolean;
  featured?: boolean;
  search?: string;
  brand?: string | string[];       // Slug or array of slugs
  btu?: string | string[];         // Slug or array of slugs
  energy?: string | string[];      // Slug or array of slugs
  minPrice?: number;
  maxPrice?: number;
  orderby?: { field: string; order: string };
  exclude?: number[];
  inStock?: boolean;
}

// Helper to normalize attribute names
const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');

// Helper to standardize BTU to conventional steps
const standardizeBtu = (str: string) => {
    const lower = str.toLowerCase();
    const hasBtuWord = lower.includes('btu');
    const match = str.match(/(?:^|\D)(\d{4,5})(?:\D|$)/); 
    
    if (!match) return null;
    if (!hasBtuWord && lower.includes('kw')) return null;

    let btu = parseInt(match[1], 10);
    if (btu < 4000 || btu > 80000) return null;

    const standards = [5000, 7000, 9000, 12000, 14000, 15000, 18000, 21000, 22000, 24000, 28000, 32000, 36000, 42000, 48000, 60000];
    let closest = standards[0];
    let minDiff = Math.abs(btu - closest);
    for (const s of standards) {
        const diff = Math.abs(btu - s);
        if (diff < minDiff) {
            closest = s;
            minDiff = diff;
        }
    }
    
    if (minDiff <= 3000) {
        return closest;
    }
    return btu;
};

// Extracted function to fetch ALL products (cached)
export async function getAllProductsCached(): Promise<WooCommerceProduct[]> {
  let allProducts: any[] = [];
  let hasMore = true;
  let cursor = null;
  let fetchCount = 0;
  const MAX_FETCH = 2000;

  while (hasMore && allProducts.length < MAX_FETCH) {
    fetchCount++;
    const query = `
        query GetAllProducts($after: String) {
          products(first: 100, after: $after) {
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
                productCategories {
                  nodes { name slug }
                }
                allPaBrand {
                  nodes { name slug }
                }
                attributes {
                  nodes {
                    name
                    options
                    ... on GlobalProductAttribute {
                      terms {
                        nodes { name slug }
                      }
                    }
                  }
                }
              }
              ... on VariableProduct {
                price
                regularPrice
                salePrice
                stockStatus
                sku
                productCategories {
                  nodes { name slug }
                }
                allPaBrand {
                  nodes { name slug }
                }
                 attributes {
                  nodes {
                    name
                    options
                    ... on GlobalProductAttribute {
                      terms {
                        nodes { name slug }
                      }
                    }
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
        body: JSON.stringify({ query, variables: { after: cursor } }),
        next: { revalidate: 3600 }, // Cache for 1 hour for the MASTER list
      });

      if (!response.ok) break;
      const json = await response.json();
      if (json.errors) {
        console.error('GraphQL Errors in getAllProductsCached:', JSON.stringify(json.errors));
        break;
      }

      const data = json.data?.products;
      if (!data) break;

      allProducts = [...allProducts, ...data.nodes];
      hasMore = data.pageInfo?.hasNextPage || false;
      cursor = data.pageInfo?.endCursor || null;

    } catch (error) {
      console.error('Error fetching batch:', error);
      break;
    }
  }

  return replaceUrlInObject(allProducts);
}

// Logic to Generate Filters for ALL Top-Level Categories based on products
export function generateCategoryFilters(products: any[], categories: WooCommerceCategory[]) {
  const filterMap: Record<string, { capacities: any[], energyClasses: any[], brands: any[] }> = {};

  // Helper to normalize
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');

  // Helper to map category Slug to all its descendant slugs
  const getDescendantSlugs = (node: WooCommerceCategory): string[] => {
    const slugs = [node.slug];
    if (node.children?.nodes) {
      node.children.nodes.forEach(child => {
        slugs.push(...getDescendantSlugs(child));
      });
    }
    return slugs;
  };

  // Pre-calculate slug sets for each top-level category
  const categorySlugMap = new Map<string, Set<string>>();
  categories.forEach(cat => {
    categorySlugMap.set(cat.slug, new Set(getDescendantSlugs(cat)));
  });

  // Iterate over Top Level Categories
  categories.forEach(rootCat => {
    const validSlugs = categorySlugMap.get(rootCat.slug);
    if (!validSlugs) return;

    // Filter products belonging to this tree
    const categoryProducts = products.filter(p => {
      const pCats = p.productCategories?.nodes || [];
      return pCats.some((c: any) => validSlugs.has(c.slug));
    });

    if (categoryProducts.length === 0) return;

    // Aggregators
    const capMap = new Map<string, any>();
    const energyMap = new Map<string, any>();
    const brandMap = new Map<string, any>();

    categoryProducts.forEach(p => {
      const attrs = p.attributes?.nodes || [];

      // Brands (from allPaBrand)
      if (p.allPaBrand?.nodes) {
        p.allPaBrand.nodes.forEach((b: any) => {
          brandMap.set(b.slug, { ...b, count: (brandMap.get(b.slug)?.count || 0) + 1 });
        });
      }

      // Attributes
      attrs.forEach((a: any) => {
        const name = a.name?.toLowerCase() || '';
        const slug = a.name?.toLowerCase().replace(/^pa_/, '') || ''; // Some implementations return slug in name or vice versa depending on query

        // Capacitate / BTU
        // Check for 'capacitate', 'btu', or specific slug 'pa_capacitate'
        if (name.includes('capacitate') || name.includes('btu') || name === 'pa_capacitate') {
          if (a.terms?.nodes && a.terms.nodes.length > 0) {
            a.terms.nodes.forEach((t: any) => {
              const std = standardizeBtu(t.name);
              if (std !== null) {
                const finalSlug = `${std}-btu`;
                const finalName = `${std} BTU`;
                capMap.set(finalSlug, { name: finalName, slug: finalSlug, count: (capMap.get(finalSlug)?.count || 0) + 1 });
              }
            });
          } else if (a.options && a.options.length > 0) {
            a.options.forEach((o: string) => {
              const std = standardizeBtu(o);
              if (std !== null) {
                const finalSlug = `${std}-btu`;
                const finalName = `${std} BTU`;
                capMap.set(finalSlug, { name: finalName, slug: finalSlug, count: (capMap.get(finalSlug)?.count || 0) + 1 });
              }
            });
          }
        }

        // Energy
        // Check for 'clasa', 'energy', 'energie', or specific slug 'pa_clasa_energie'
        if ((name.includes('clasa') || name.includes('energy') || name.includes('energie') || name === 'pa_clasa_energie') && !name.includes('zgomot')) {
          const formatEnergySlug = (str: string) => str.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
          
          if (a.terms?.nodes && a.terms.nodes.length > 0) {
            a.terms.nodes.forEach((t: any) => {
                const finalSlug = formatEnergySlug(t.name);
                energyMap.set(finalSlug, { name: t.name.toUpperCase(), slug: finalSlug, count: (energyMap.get(finalSlug)?.count || 0) + 1 });
            });
          } else if (a.options && a.options.length > 0) {
            a.options.forEach((o: string) => {
              if (o.toUpperCase().includes('A')) {
                const finalSlug = formatEnergySlug(o);
                energyMap.set(finalSlug, { name: o.toUpperCase(), slug: finalSlug, count: (energyMap.get(finalSlug)?.count || 0) + 1 });
              }
            });
          }
        }
      });
    });

    // Sort and Slice
    const toList = (map: Map<string, any>) => Array.from(map.values()).sort((a, b) => b.count - a.count);

    filterMap[rootCat.slug] = {
      capacities: toList(capMap).sort((a, b) => (parseInt(a.name) || 0) - (parseInt(b.name) || 0)), // numeric sort for cap
      energyClasses: toList(energyMap),
      brands: toList(brandMap).slice(0, 8)
    };
  });

  return filterMap;
}

export async function getProducts(params: GetProductsParams = {}, limit = 24, after: string | null = null, context: string = 'DEFAULT'): Promise<{ products: WooCommerceProduct[], pageInfo: any, filters?: any, total?: number }> {
  console.log(`[DEBUG] getProducts called. Context: ${context}. Limit: ${limit}. Params: ${JSON.stringify(params)}`);

  // Use the cached fetcher
  const allProducts = await getAllProductsCached();


  // --- 1. FILTERING & AGGREGATION ---
  const { category, search, brand, btu, energy, minPrice, maxPrice } = params;

  // Helper: Recursive Category Filtering
  // Products are often only assigned to child categories (e.g. Split de Perete) but not Parent (Aer Conditionat).
  // So if user selects Parent, we must include products from Children.

  let targetCategories = new Set<string>();
  if (category) {
    targetCategories.add(category);
    try {
      // We can safely call this hoisted function
      const allCats = await getWooCommerceCategories();

      const collectDescendants = (node: WooCommerceCategory) => {
        targetCategories.add(node.slug);
        node.children?.nodes.forEach(child => collectDescendants(child));
      };

      const findNode = (cats: WooCommerceCategory[]): WooCommerceCategory | null => {
        for (const c of cats) {
          if (c.slug === category) return c;
          if (c.children?.nodes) {
            const found = findNode(c.children.nodes);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNode(allCats);
      if (targetNode) collectDescendants(targetNode);

      console.log(`[DEBUG] Category filter: ${category} includes descendants: ${Array.from(targetCategories).join(', ')}`);
    } catch (e) {
      console.error('Error fetching categories for hierarchy:', e);
    }
  }

  // Step A: Filter by Context (Category, Search) -> Base Set for Facets
  let baseProducts = allProducts.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category) {
      const cats = p.productCategories?.nodes || [];
      if (!cats.some((c: any) => targetCategories.has(c.slug))) return false;
    }
    if (params.inStock && p.stockStatus !== 'IN_STOCK') return false;
    return true;
  });

  console.log(`[DEBUG] Total Products: ${allProducts.length}`);
  console.log(`[DEBUG] Category: ${category}, Base Products: ${baseProducts.length}`);
  if (baseProducts.length > 0) {
    console.log(`[DEBUG] First Product: ${baseProducts[0].name}`);
    console.log(`[DEBUG] First Product Attributes:`, JSON.stringify(baseProducts[0].attributes));
  }

  const extractFacets = (products: any[], keywords: string[]) => {
    const counts = new Map<string, { term: string, slug: string, name: string, count: number }>();
    const isBtu = keywords.includes('btu') || keywords.includes('capacitate') || keywords.includes('pa_btu');
    const isEnergy = keywords.includes('energi') || keywords.includes('clasa') || keywords.includes('pa_clasa');

    const formatEnergySlug = (str: string) => str.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');

    products.forEach(p => {
      const pAttrs = p.attributes?.nodes || [];
      pAttrs.forEach((a: any) => {
        const name = a.name?.toLowerCase() || '';
        const label = a.label?.toLowerCase() || '';
        if (keywords.some(kw => name.includes(kw) || label.includes(kw))) {
          // Prefer terms (global), fallback to options (local)
          if (a.terms?.nodes && a.terms.nodes.length > 0) {
            a.terms.nodes.forEach((t: any) => {
              let finalSlug = t.slug;
              let finalName = t.name;
              
              if (isBtu) {
                  const std = standardizeBtu(t.name);
                  if (std === null) return;
                  finalSlug = `${std}-btu`;
                  finalName = `${std} BTU`;
              } else if (isEnergy) {
                  finalSlug = formatEnergySlug(t.name);
                  finalName = t.name.toUpperCase();
              }

              const current = counts.get(finalSlug) || { term: finalName, name: finalName, slug: finalSlug, count: 0 };
              current.count++;
              counts.set(finalSlug, current);
            });
          } else if (a.options && a.options.length > 0) {
            a.options.forEach((opt: string) => {
              let finalSlug = normalize(opt);
              let finalName = opt;
              
              if (isBtu) {
                  const std = standardizeBtu(opt);
                  if (std === null) return;
                  finalSlug = `${std}-btu`;
                  finalName = `${std} BTU`;
              } else if (isEnergy && opt.toUpperCase().includes('A')) {
                  finalSlug = formatEnergySlug(opt);
                  finalName = opt.toUpperCase();
              } else if (isEnergy) {
                  return; // Skip if it doesn't contain 'A'
              }

              const current = counts.get(finalSlug) || { term: finalName, name: finalName, slug: finalSlug, count: 0 };
              current.count++;
              counts.set(finalSlug, current);
            });
          }
        }
      });
    });
    const results = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    return results;
  };

  // Helper to extract category counts from base products
  const extractCategoryCounts = (products: any[]) => {
    const counts = new Map<string, number>();
    products.forEach(p => {
      const productCats = p.productCategories?.nodes || [];
      productCats.forEach((c: any) => {
        // For each category explicitly assigned to the product
        const current = counts.get(c.slug) || 0;
        counts.set(c.slug, current + 1);

        // NOTE: Ideally we would walk up the tree here if we had parent info on the product,
        // but 'baseProducts' already contains ALL subcategory products if we queried for a parent.
        // HOWEVER, on the main archive page, baseProducts has EVERYTHING.
        // So if a product is in 'wall-split', it counts for 'wall-split'. 
        // We need to ensure we also count it for 'residential-ac' if that relation isn't explicit in productCategories.
      });
    });
    return Object.fromEntries(counts);
  };

  // Improved Strategy:
  // Since we don't have the full tree in 'p', we can't easily walk up.
  // BUT, we have `categories` (fetched via GetWooCommerceCategories in the page).
  // In `getProducts`, we just return the raw counts per leaf category.
  // The frontend `ProductFilter` will receive this map.
  // Actually, wait. The request is simple: "Show (94) for Residential AC".
  // If `p` has `productCategories` nodes, usually it only has the leaf or seemingly random ones.
  // Let's rely on the fact that we fetched *recursive* products if a category was selected.

  // Actually, if we are on the main page, `allProducts` has products from everywhere.
  // If we count a product that has category 'split-wall', we should also increment 'residential-ac'.
  // Without the tree structure inside `getProducts`, this is hard.

  // Hack: Just count the explicit categories attached to the product. 
  // If standard WP setup, products are attached to subcategories. 
  // So 'Residential' might show 0 if products are only in children.
  // EXCEPT: In the previous step, I saw logs:
  // [DEBUG] Category: aer-conditionat-rezidential, Base Products: 94
  // This means if we filtered by that category, we have them.

  // The user wants the counts in the SIDEBAR to be correct.
  // The sidebar has a list of ALL categories.
  // If I am on the main page, I want to see (94) next to Residential.
  // The only way to get 94 is if I know which products belong to it.
  // I fetched ALL products. I can count.
  // But I need the category hierarchy to know that 'split-wall' is a child of 'residential'.
  // `getProducts` doesn't have the hierarchy.

  // Alternative: Return ALL `productCategories` slugs found in `baseProducts` and count them.
  // If a product is assigned to both Parent and Child, it counts for both.
  // If assigned only to Child, it counts for Child.

  // Let's just implement explicit counting for now and return it.
  // --- 1. FILTER PRODUCT LOGIC (HOISTED) ---
  const checkAttr = (product: any, targetSlugs: string | string[] | undefined, attrKeywords: string[]) => {
    if (!targetSlugs) return true;
    const slugs = Array.isArray(targetSlugs) ? targetSlugs : [targetSlugs];
    if (slugs.length === 0) return true;

    const isBtu = attrKeywords.includes('btu') || attrKeywords.includes('capacitate') || attrKeywords.includes('pa_btu');
    const isEnergy = attrKeywords.includes('energi') || attrKeywords.includes('clasa') || attrKeywords.includes('pa_clasa');

    const formatEnergySlug = (str: string) => str.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');

    const pAttrs = product.attributes?.nodes || [];
    const relevantTerms = pAttrs.flatMap((a: any) => {
      const name = a.name?.toLowerCase() || '';
      const label = a.label?.toLowerCase() || '';
      if (attrKeywords.some(kw => name.includes(kw) || label.includes(kw))) {
        const termSlugs = a.terms?.nodes?.map((t: any) => {
            if (isBtu) {
                const std = standardizeBtu(t.name);
                if (std !== null) return `${std}-btu`;
                return null;
            } else if (isEnergy) {
                return formatEnergySlug(t.name);
            }
            return t.slug;
        }).filter(Boolean) || [];
        const optionSlugs = a.options?.map((o: string) => {
            if (isBtu) {
                const std = standardizeBtu(o);
                if (std !== null) return `${std}-btu`;
                return null;
            } else if (isEnergy && o.toUpperCase().includes('A')) {
                return formatEnergySlug(o);
            } else if (isEnergy) {
                return null;
            }
            return normalize(o);
        }).filter(Boolean) || [];
        return [...termSlugs, ...optionSlugs];
      }
      return [];
    });

    return relevantTerms.some((slug: string) => slugs.includes(slug));
  };

  // --- 2. GENERATE FILTER CONTEXTS (INTERDEPENDENT) ---
  // To show only valid options, we filter baseProducts by *other* active filters.

  const brandContext = baseProducts.filter(p =>
    checkAttr(p, btu, ['btu', 'capacitate', 'pa_btu']) &&
    checkAttr(p, energy, ['energi', 'clasa', 'pa_clasa'])
  );

  const btuContext = baseProducts.filter(p =>
    checkAttr(p, brand, ['brand', 'producator', 'pa_brand']) &&
    checkAttr(p, energy, ['energi', 'clasa', 'pa_clasa'])
  );

  const energyContext = baseProducts.filter(p =>
    checkAttr(p, brand, ['brand', 'producator', 'pa_brand']) &&
    checkAttr(p, btu, ['btu', 'capacitate', 'pa_btu'])
  );

  // --- 3. APPLY ALL FILTERS FOR FINAL PRODUCTS & CATEGORY COUNTS ---
  let finalProducts = baseProducts.filter(p => {
    if (!checkAttr(p, brand, ['brand', 'producator', 'pa_brand'])) return false;
    if (!checkAttr(p, btu, ['btu', 'capacitate', 'pa_btu'])) return false;
    if (!checkAttr(p, energy, ['energi', 'clasa', 'pa_clasa'])) return false;
    return true;
  });

  // Calculate Categories based on FINAL filtered set (Interdependent)
  const categoryCounts = extractCategoryCounts(finalProducts);

  const filters = {
    brands: extractFacets(brandContext, ['brand', 'producator', 'pa_brand']),
    btu: extractFacets(btuContext, ['btu', 'capacitate', 'pa_btu']),
    energy: extractFacets(energyContext, ['energi', 'clasa', 'pa_clasa']),
    categories: categoryCounts
  };

  console.log('[DEBUG] Final Filters:', JSON.stringify(filters));

  // --- SORTING ---
  if (params.orderby) {
    const { field, order } = params.orderby;
    finalProducts.sort((a: any, b: any) => {
      let valA = 0, valB = 0;

      switch (field) {
        case 'PRICE':
          // Helper to extract numeric price
          const getP = (p: any) => {
            // Handle variable product or simple
            const priceStr = p.price || p.regularPrice || '0';
            return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
          };
          valA = getP(a);
          valB = getP(b);
          break;
        case 'TOTAL_SALES':
          // Fallback: Use databaseId as a stable deterministic sort if totalSales missing
          valA = a.totalSales || 0;
          valB = b.totalSales || 0;
          break;
        case 'DATE':
          // Use date if available, else databaseId as proxy for newness
          valA = a.date ? new Date(a.date).getTime() : (a.databaseId || 0);
          valB = b.date ? new Date(b.date).getTime() : (b.databaseId || 0);
          break;
        default:
          return 0;
      }

      if (order === 'ASC') return valA - valB;
      return valB - valA; // DESC
    });
  }

  // Deduplicate by ID just in case
  const uniqueIds = new Set();
  finalProducts = finalProducts.filter((p: any) => {
    if (uniqueIds.has(p.id)) return false;
    uniqueIds.add(p.id);
    return true;
  });

  console.log(`[DEBUG] Final Count (after attrs & dedup): ${finalProducts.length}`);

  // --- 2. PAGINATION ---
  // Handle "page:N" cursor
  let currentPage = 1;
  if (after && after.startsWith('page:')) {
    currentPage = parseInt(after.split(':')[1]) || 1;
  }

  const start = (currentPage - 1) * limit;
  const end = start + limit;

  const paginatedProducts = finalProducts.slice(start, end);
  const hasNextPage = end < finalProducts.length;
  const endCursor = hasNextPage ? `page:${currentPage + 1}` : null;

  // Debug stock distribution
  const stockCounts = finalProducts.reduce((acc: any, p: any) => {
    const status = p.stockStatus || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  console.log(`[DEBUG] Stock Distribution:`, JSON.stringify(stockCounts));

  return {
    products: paginatedProducts,
    pageInfo: {
      hasNextPage,
      endCursor,
      total: finalProducts.length // Pass total to UI
    },
    filters // Return derived filters
  };
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

// Helper to fetch global attributes for filtering
// Helper to fetch global attributes for filtering
export async function getAttributes(taxonomy: string = 'pa_brand'): Promise<{ term: string, count: number, slug: string }[]> {
  /*
    Robust Term Fetching:
    Since Enum mapping (PA_BTU vs PACAPACITATE vs PABTU) is fragile and failing.
    We will fetch terms using standard root queries if available, OR try a broad fetch if needed.
    Actually, WPGraphQL provides root connection for registered taxonomies like `paBtus` or `allPaTerm`.
    But `list-taxonomies` showed paths like `paBtu`.
    Let's try querying the root field `paBtu { nodes { ... } }` dynamically?
    No, dynamic queries are risky.
    
    Fallback Strategy:
    We know the slugs: 'pa_brand', 'pa_btu', 'pa_clasa-energetica'.
    We will implement specific queries for each known taxonomy to ensure correctness.
  */

  let query = '';

  // 1. BRAND
  if (taxonomy === 'pa_brand' || taxonomy === 'brand') {
    query = `query GetBrands { allPaBrand(first: 100, where: { hideEmpty: true }) { nodes { name slug count } } }`;
  }
  // 2. BTU
  else if (taxonomy === 'pa_btu' || taxonomy === 'btu') {
    // Based on list-taxonomies, it might be allPaBtu? Test script said NO on SimpleProduct, but maybe on Root?
    // Let's try `allPaBtu`. If that fails, we fallback to terms query with loose enum?
    // The previous error for PA_CAPACITATE suggestion was "Did you mean PACAPACITATE?".
    // So PACAPACITATE *should* be valid? But my test failed with "Value PACAPACITATE does not exist"? 
    // Startling. Maybe it was "PACAPACITATE"?

    // Let's try referencing the taxonomy by NAME in `terms` if possible? No, it takes Enum.

    // Let's try fetching distinct attributes from the PRODUCTS we already loaded?
    // That is the MOST robust way for consistency with current result set!
    // But `getAttributes` is called separately in ArchivePage.

    // Correct approach: Since we can't guess the Enum, and Root query `allPaBtu` failed on product... 
    // but wait, `allPaBtu` might work on RootQuery even if not on Product?
    // Let's assume standard WPGraphQL naming: `allPaBtu` or `paBtus`.
    // Inspecting list-taxonomies again: GraphQL Path: `paBtu`. 
    // Usually this means the connection is `paBtus` or `allPaBtu`.

    // Hack/Fix:
    // Use the `getProducts` "Nuclear Option" logic to EXTRACT attributes from the fetched products!
    // This guarantees that filters match the products.
    // We can export a helper or just return unique attributes from `getProducts`.
    // But `ArchivePage` calls them in parallel.

    // Temporary consistency fix:
    // Return empty for now to stop errors? No, user wants filters.

    // I will try `allPaBtu` as root query.
    query = `query GetBtu { allPaBtu(first: 100, where: { hideEmpty: true }) { nodes { name slug count } } }`;
  }
  // 3. Energy
  else if (taxonomy === 'pa_clasa-energetica') {
    query = `query GetEnergy { allPaClasaEnergetica(first: 100, where: { hideEmpty: true }) { nodes { name slug count } } }`;
    // Fallback name if that fails? `allPaClasaEnergie`?
  }

  if (!query) return [];

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const json = await response.json();

    // Determine data key
    const data = json.data;
    const nodes = data?.allPaBrand?.nodes || data?.allPaBtu?.nodes || data?.allPaClasaEnergetica?.nodes || [];

    return nodes.map((n: any) => ({
      term: n.name,
      slug: n.slug,
      count: n.count
    }));

  } catch (e) {
    console.error(`Error fetching attributes for ${taxonomy}:`, e);
    return [];
  }
}

export async function getProductsByTag(tag: string, limit: number = 4): Promise<WooCommerceProduct[]> {
  const query = `
    query GetProductsByTag($tag: String!, $limit: Int!) {
    products(first: $limit, where: { tagIn: [$tag] }) {
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
        variables: { tag, limit }
      }),
      next: { revalidate: 60 },
    });



    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.products?.nodes || [];
  } catch (error) {
    console.error('Error fetching products by tag:', error);
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

    const allNodes = (json.data?.productCategories?.nodes || []).filter(Boolean);

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

    return replaceUrlInObject(roots);
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

import { getBrandImage } from './brandImages';

// Modified to fetch BOTH pa_brand (for counts) and product_brand (for images) and merge them.
export async function getAllBrands(): Promise<WooCommerceBrand[]> {
  const query = `
    query GetAllBrands {
      allPaBrand(first: 50, where: { hideEmpty: true, orderby: COUNT, order: DESC }) {
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
      next: { revalidate: 0 },
    });

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    const paNodes = (json.data?.allPaBrand?.nodes || []).filter(Boolean);

    // Fallback to Local Map if API image is missing
    return replaceUrlInObject(paNodes.map((node: any) => {
      if (node.brandImage) return node;
      const localInfo = getBrandImage(node.slug);
      if (localInfo && localInfo.imageUrl) {
        return { ...node, brandImage: localInfo.imageUrl };
      }
      return node;
    }));

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
      allPaBtu(first: 50, where: { hideEmpty: true }) {
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

    const capNodes = (json.data?.allPaCapacitate?.nodes || []).filter(Boolean);
    const btuNodes = (json.data?.allPaBtu?.nodes || []).filter(Boolean);

    // Merge and Deduplicate by Slug
    const merged = [...capNodes, ...btuNodes];
    const unique = Array.from(new Map(merged.map(item => [item.slug, item])).values());

    // Sort numerically if possible (9000 before 12000)
    return unique.sort((a, b) => {
      const valA = parseInt(a.name.replace(/\D/g, '')) || 0;
      const valB = parseInt(b.name.replace(/\D/g, '')) || 0;
      return valA - valB;
    });

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
    return (json.data?.allPaClasaEnergie?.nodes || []).filter(Boolean);
  } catch (error) {
    console.error('Error fetching energy class:', error);
    return [];
  }
}

// Helper to get USED attributes in a category (Dynamically)
// Updated to fetch up to 500 products to ensure full coverage
export async function getUsedAttributeSlugs(categorySlugs: string[]): Promise<{ capacitySlugs: string[], energyNames: string[] }> {
  const query = `
    query GetUsedAttributes {
      products(first: 500, where: { categoryIn: ${JSON.stringify(categorySlugs)}, status: "PUBLISH" }) {
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

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }
    });

    const json = await response.json();
    const products = json.data?.products?.nodes || [];

    const capacitySet = new Set<string>();
    const energyNameSet = new Set<string>();

    products.forEach((p: any) => {
      const attrs = p.attributes?.nodes || [];
      attrs.forEach((attr: any) => {
        const name = attr.name?.toLowerCase() || '';
        const slug = attr.slug?.toLowerCase() || '';

        // Capacity Logic
        if (name === 'capacitate' || slug === 'pa_capacitate' || name.includes('btu')) {
          // Prefer Global Terms Slugs if available
          if (attr.terms?.nodes?.length > 0) {
            attr.terms.nodes.forEach((t: any) => capacitySet.add(t.slug));
          } else if (attr.startOptions) { // Local options
            attr.startOptions.forEach((o: string) => capacitySet.add(o.toLowerCase().replace(/ /g, '-')));
          }
        }

        // Energy Logic - Collect NAMES
        if (name.includes('clasa') && (name.includes('energ') || name.includes('ie'))) {
          // A+++ -> a-plus-plus-plus ? Or just slugify.
          // Let's try to capture Global Terms first.
          if (attr.terms?.nodes?.length > 0) {
            attr.terms.nodes.forEach((t: any) => energyNameSet.add(t.name.toUpperCase())); // A++
          } else if (attr.startOptions) {
            attr.startOptions.forEach((o: string) => {
              // Attempt to normalize "A++" to a slug format if possible, or just keep it.
              // If `allEnergyClasses` contains the dirty name as slug, fine.
              // But usually WP slugs are sanitized. 
              // Let's add the option AS IS, and also a simple slugified version.
              energyNameSet.add(o.toUpperCase());
              // Handle "A++ / A+" cases by splitting?
              // For now, exact match or simple normalization
            });
          }
        }
      });
    });

    return {
      capacitySlugs: Array.from(capacitySet),
      energyNames: Array.from(energyNameSet)
    };
  } catch (error) {
    console.error('Error fetching used attributes:', error);
    return { capacitySlugs: [], energyNames: [] };
  }
}

export async function createWooCommerceOrder(orderData: any): Promise<any> {
  // Use internal URL for server-to-server communication if possible, or fallback to public
  // Note: we need the REST root, not GraphQL
  // Usually http://wordpress:80/wp-json or https://cms.climaticpro.ro/wp-json

  // Clean URL to base
  const baseUrl = (process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql').replace('/graphql', '/wp-json');

  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!key || !secret) {
    console.error('WooCommerce Consumer Credentials missing');
    return { success: false, error: 'Credentials missing' };
  }

  // Use Query Params for Auth to avoid header stripping issues
  // This is safe for server-to-server communication
  const url = `${baseUrl}/wc/v3/orders?consumer_key=${key}&consumer_secret=${secret}`;

  console.log(`Attempting to create WooCommerce order at ${baseUrl} with Key ending in ...${key.slice(-4)}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse WooCommerce response:', responseText);
      return { success: false, error: 'Invalid response from server' };
    }

    if (!response.ok) {
      console.error('WooCommerce Order Error:', data);
      return { success: false, error: data.message || 'Failed to create order' };
    }

    return { success: true, order: data };
  } catch (error) {
    console.error('Error creating WooCommerce order:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createWooCommerceProduct(productData: any): Promise<any> {
  const baseUrl = (process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql').replace('/graphql', '/wp-json');
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!key || !secret) {
    console.error('WooCommerce credentials missing for createWooCommerceProduct');
    return { success: false, error: 'Credentials missing' };
  }

  const url = `${baseUrl}/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse WooCommerce response on Create Product:', responseText);
      return { success: false, error: 'Invalid response from server' };
    }

    if (!response.ok) {
      console.error('WooCommerce Create Product Error:', data);
      return { success: false, error: data.message || 'Failed to create product' };
    }

    return { success: true, product: data };
  } catch (error) {
    console.error('Error creating WooCommerce product:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateWooCommerceProduct(productId: number, updateData: any): Promise<boolean> {
  const baseUrl = (process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql').replace('/graphql', '/wp-json');
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!key || !secret) {
    console.error('WooCommerce credentials missing for updateWooCommerceProduct');
    return false;
  }

  const url = `${baseUrl}/wc/v3/products/${productId}?consumer_key=${key}&consumer_secret=${secret}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Failed to update WooCommerce Product ID ${productId}:`, err);
        return false;
    }

    console.log(`WooCommerce Product ID ${productId} successfully synced.`);
    return true;
  } catch (error) {
    console.error(`Network Error updating WooCommerce Product ID ${productId}:`, error);
    return false;
  }
}

export async function smartSyncB2BToWooCommerce(product: any, hasStock: boolean = true) {
    const wooProduct = await getProductBySlug(product.slug);
    
    // Construct full image URL for sideloading from PIM relative path
    let images = [];
    if (product.image) {
        images.push({ src: `https://climaticpro.ro${product.image}` });
    }

    const price = String(product.priceRetail || product.priceB2B);
    const stock_status = hasStock ? 'instock' : 'outofstock';
    
    // Extract wp category ids (from wooCategoryIds)
    const categories = Array.isArray(product.wooCategoryIds) ? product.wooCategoryIds.map((id: number) => ({ id })) : [];
    
    const baseData: any = {
        name: product.name,
        regular_price: price,
        stock_status,
        manage_stock: product.manageStock,
        description: product.description || '',
        meta_data: [
            { key: '_force_installation', value: product.forceInstallation ? 'true' : 'false' }
        ]
    };

    if (product.sku) {
        baseData.sku = product.sku;
    }
    
    if (product.manageStock) {
        baseData.stock_quantity = product.stock;
    }

    if (wooProduct) {
         // UPDATE existing
         try {
             return await updateWooCommerceProduct(wooProduct.databaseId, baseData);
         } catch(e) {
             console.error('Failed smartSync Update', e);
             return false;
         }
    } else {
         // CREATE new
         const createData = {
             ...baseData,
             type: 'simple',
             status: 'publish',
             slug: product.slug,
             sku: product.sku || product.slug, // fallback sku
             categories: categories,
             images: images
         };
         try {
             const res = await createWooCommerceProduct(createData);
             return res.success;
         } catch(e) {
             console.error('Failed smartSync Create', e);
             return false;
         }
    }
}
