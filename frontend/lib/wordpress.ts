import { NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql';

export interface BlogPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories?: {
    nodes: {
      name: string;
      slug: string;
    }[];
  };
  author?: {
    node: {
      name: string;
      avatar: {
        url: string;
      };
    };
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Banner {
  id: string;
  title: string;
  sourceUrl: string;
  altText?: string;
  mediaDetails?: {
    width: number;
    height: number;
    file: string;
  };
}

async function fetchGraphQL(query: string, variables?: any, revalidate: number = 60) {
  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

    if (!response.ok) {
      console.error('GraphQL Fetch Error:', response.statusText);
      return null;
    }

    const json = await response.json();
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return null;
    }

    return replaceUrlInObject(json.data);
  } catch (error) {
    console.error('Error fetching GraphQL:', error);
    return null;
  }
}

// Helper to replace old domain with new CMS domain recursively in response
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

export async function getPosts(first: number = 12, after?: string, categorySlug?: string): Promise<{ posts: BlogPost[], pageInfo: any }> {
  // If categorySlug is provided, we filter by category
  const whereClause = categorySlug ? `, where: { categoryName: "${categorySlug}" }` : '';

  const query = `
    query GetPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after ${whereClause}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          databaseId
          title
          slug
          excerpt(format: RAW)
          content(format: RENDERED)
          date
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
           author {
            node {
              name
              avatar {
                url
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchGraphQL(query, { first, after });
  const posts = data?.posts?.nodes || [];

  // Fallback: Extract first image from content if featuredImage is missing
  const postsWithImages = posts.map((post: any) => {
    if (!post.featuredImage) {
      const imgMatch = post.content?.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        return {
          ...post,
          featuredImage: {
            node: {
              sourceUrl: imgMatch[1],
              altText: post.title
            }
          }
        };
      }
    }
    return post;
  });

  return {
    posts: postsWithImages,
    pageInfo: data?.posts?.pageInfo || {}
  };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const query = `
    query GetPostBySlug($id: ID!) {
      post(id: $id, idType: SLUG) {
        id
        databaseId
        title
        slug
        content(format: RENDERED)
        excerpt(format: RAW)
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        author {
            node {
              name
              avatar {
                url
              }
            }
          }

      }
    }
  `;

  const data = await fetchGraphQL(query, { id: slug });
  return data?.post || null;
}

export async function getCategories(): Promise<BlogCategory[]> {
  const query = `
    query GetCategories {
      categories(first: 20, where: { hideEmpty: true }) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `;

  const data = await fetchGraphQL(query, {}, 3600);
  return data?.categories?.nodes || [];
}

export async function getRecentPosts(count: number = 3): Promise<BlogPost[]> {
  return (await getPosts(count)).posts;
}

export async function getLatestBannerGallery(): Promise<Banner[]> {
  const query = `
    query GetLatestBanners {
      bannere(first: 1, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          databaseId
          title
          bannereSlots {
            heroImage1 {
              sourceUrl
              altText
              mediaDetails {
                width
                height
                file
              }
            }
            heroImage2 {
              sourceUrl
              altText
              mediaDetails {
                width
                height
                file
              }
            }
            heroImage3 {
              sourceUrl
              altText
              mediaDetails {
                width
                height
                file
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchGraphQL(query);
  const latestBanner = data?.bannere?.nodes[0];

  if (!latestBanner?.bannereSlots) {
    return [];
  }

  const { heroImage1, heroImage2, heroImage3 } = latestBanner.bannereSlots;
  const banners: Banner[] = [];

  if (heroImage1?.sourceUrl) {
    banners.push({
      id: `${latestBanner.databaseId}-1`,
      title: latestBanner.title,
      sourceUrl: heroImage1.sourceUrl,
      altText: heroImage1.altText || latestBanner.title,
      mediaDetails: heroImage1.mediaDetails
    });
  }

  if (heroImage2?.sourceUrl) {
    banners.push({
      id: `${latestBanner.databaseId}-2`,
      title: latestBanner.title,
      sourceUrl: heroImage2.sourceUrl,
      altText: heroImage2.altText || latestBanner.title,
      mediaDetails: heroImage2.mediaDetails
    });
  }

  if (heroImage3?.sourceUrl) {
    banners.push({
      id: `${latestBanner.databaseId}-3`,
      title: latestBanner.title,
      sourceUrl: heroImage3.sourceUrl,
      altText: heroImage3.altText || latestBanner.title,
      mediaDetails: heroImage3.mediaDetails
    });
  }

  return banners;
}
