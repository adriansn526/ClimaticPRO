/**
 * Bannere Management - GraphQL queries pentru bannere ClimaticPRO
 */

export interface Banner {
  id: string;
  title: string;
  bannerSettings: {
    locatie: string[];
    imagineDesktop?: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
    imagineMobile?: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
    titluBanner?: string;
    subtitluBanner?: string;
    ctaText?: string;
    ctaLink?: string;
    ctaStyle?: string;
    ordine?: number;
    activ: boolean;
    dataStart?: string;
    dataSfarsit?: string;
    targetBlank?: boolean;
  };
}

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://cms.climaticpro.ro/graphql';

/**
 * Obține bannere după locație
 * @param locatie - Locația bannerului (ex: 'homepage_hero', 'produse_sidebar')
 * @param limit - Număr maxim de bannere (default: 10)
 * @returns Array de bannere active, sortate după ordine
 */
export async function getBannereByLocatie(locatie: string, limit: number = 10): Promise<Banner[]> {
  const query = `
    query GetBannere($limit: Int!) {
      bannere(
        first: $limit
        where: { orderby: { field: MENU_ORDER, order: ASC } }
      ) {
        nodes {
          id
          title
          bannerSettings {
            locatie
            imagineDesktop {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
            imagineMobile {
              sourceUrl
              altText
              mediaDetails {
                width
                height
              }
            }
            titluBanner
            subtitluBanner
            ctaText
            ctaLink
            ctaStyle
            ordine
            activ
            dataStart
            dataSfarsit
            targetBlank
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { limit } }),
      next: { revalidate: 300 }, // Cache 5 minute
    } as RequestInit & { next?: { revalidate?: number } });

    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return [];
    }

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    const allBannere = json.data?.bannere?.nodes || [];

    // Filtrare bannere după locație și status activ
    const filteredBannere = allBannere.filter((banner: Banner) => {
      // Verifică dacă bannerul este activ
      if (!banner.bannerSettings.activ) return false;

      // Verifică dacă locația se potrivește
      if (!banner.bannerSettings.locatie?.includes(locatie)) return false;

      // Verifică data start (dacă există)
      if (banner.bannerSettings.dataStart) {
        const startDate = new Date(banner.bannerSettings.dataStart);
        const now = new Date();
        if (now < startDate) return false;
      }

      // Verifică data sfârșit (dacă există)
      if (banner.bannerSettings.dataSfarsit) {
        const endDate = new Date(banner.bannerSettings.dataSfarsit);
        const now = new Date();
        if (now > endDate) return false;
      }

      return true;
    });

    // Sortare după ordine
    filteredBannere.sort((a: Banner, b: Banner) => {
      const ordineA = a.bannerSettings.ordine || 0;
      const ordineB = b.bannerSettings.ordine || 0;
      return ordineA - ordineB;
    });

    console.log(`Loaded ${filteredBannere.length} bannere for location: ${locatie}`);

    return filteredBannere;
  } catch (error) {
    console.error('Error fetching bannere:', error);
    return [];
  }
}

/**
 * Obține toate bannerele active
 * @param limit - Număr maxim de bannere (default: 50)
 * @returns Array de toate bannerele active
 */
export async function getAllBannere(limit: number = 50): Promise<Banner[]> {
  const query = `
    query GetAllBannere($limit: Int!) {
      bannere(
        first: $limit
        where: { orderby: { field: MENU_ORDER, order: ASC } }
      ) {
        nodes {
          id
          title
          bannerSettings {
            locatie
            imagineDesktop {
              sourceUrl
              altText
            }
            imagineMobile {
              sourceUrl
              altText
            }
            titluBanner
            subtitluBanner
            ctaText
            ctaLink
            ctaStyle
            ordine
            activ
            dataStart
            dataSfarsit
            targetBlank
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { limit } }),
      next: { revalidate: 300 },
    } as RequestInit & { next?: { revalidate?: number } });

    if (!response.ok) {
      console.error('WordPress API error:', response.status, response.statusText);
      return [];
    }

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    const allBannere = json.data?.bannere?.nodes || [];

    // Filtrare doar bannere active
    return allBannere.filter((banner: Banner) => banner.bannerSettings.activ);
  } catch (error) {
    console.error('Error fetching all bannere:', error);
    return [];
  }
}
