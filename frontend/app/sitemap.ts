import { MetadataRoute } from 'next';
import { getAllProductsCached, getWooCommerceCategories } from '@/lib/woocommerce';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://climaticpro.ro';

    // Static routes
    const routes = [
        '',
        '/produse',
        '/servicii/instalare',
        '/servicii/mentenanta',
        '/contact',
        '/despre-noi',
        '/blog',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Products
    const products = await getAllProductsCached();
    const productRoutes = products.map((product) => ({
        url: `${baseUrl}/produs/${product.slug}`,
        lastModified: new Date(new Date()), // dateGmt unavailable in public schema
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // Categories
    const categories = await getWooCommerceCategories();
    const categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/categorie/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...productRoutes, ...categoryRoutes];
}
