import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/graphql';

export interface Banner {
  id: string;
  sourceUrl: string;
  altText: string;
  title: string;
  mediaDetails: {
    width: number;
    height: number;
    file: string;
  };
}

export async function getBannereClimatizare(): Promise<Banner[]> {
  const query = `
    query GetBannereClimatizare {
      mediaItems(
        first: 3, 
        where: {
          orderby: {field: DATE, order: DESC}
        }
      ) {
        nodes {
          id
          sourceUrl
          altText
          title
          mediaDetails {
            width
            height
            file
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
      next: { revalidate: 60 }, // ISR 1 minute pentru refresh mai frecvent
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

    const banners = json.data?.mediaItems?.nodes || [];

    // Filtrează doar imaginile valide cu sourceUrl
    const validBanners = banners.filter((banner: Banner) => banner.sourceUrl);

    if (validBanners.length === 0) {
      console.warn('No banners found in WordPress - using fallback');
    } else {
      console.log(`Loaded ${validBanners.length} banners from WordPress`);
    }

    return validBanners;
  } catch (error) {
    console.error('Error fetching bannere:', error);
    return [];
  }
}

const httpLink = new HttpLink({
  uri: WORDPRESS_API_URL,
  fetch,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});

// Helper function to clean Visual Composer shortcodes
export function cleanVisualComposerShortcodes(content: string): string {
  if (!content) return '';

  return content
    .replace(/\[vc_row[^\]]*\]/g, '')
    .replace(/\[\/vc_row\]/g, '')
    .replace(/\[vc_column[^\]]*\]/g, '')
    .replace(/\[\/vc_column\]/g, '')
    .replace(/\[vc_column_text[^\]]*\]/g, '')
    .replace(/\[\/vc_column_text\]/g, '')
    .replace(/\[vc_[^\]]*\]/g, '')
    .replace(/\[\/vc_[^\]]*\]/g, '')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}

// Example query functions
export async function getPageBySlug(slug: string, locale: string = 'ro') {
  // Implement your GraphQL queries here
  return null;
}
