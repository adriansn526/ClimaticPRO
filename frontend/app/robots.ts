import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/cart', '/my-account', '/checkout', '/api/*'],
        },
        sitemap: 'https://climaticpro.ro/sitemap.xml',
    };
}
