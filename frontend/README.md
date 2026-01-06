# ClimaticPro - Frontend

Next.js 15 frontend with WordPress headless CMS integration.

## Tech Stack

- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **i18n**: next-intl (RO/EN)
- **CMS**: WordPress (GraphQL via WPGraphQL)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t climaticpro-frontend:latest .
```

## Environment Variables

- `NEXT_PUBLIC_WORDPRESS_API_URL`: WordPress GraphQL endpoint
- `NEXT_PUBLIC_SITE_URL`: Frontend URL

## SEO Best Practices

- Dynamic metadata per page
- Open Graph tags
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt
- Canonical URLs
- Hreflang alternates
- Image optimization
- ISR (Incremental Static Regeneration)

## Deployment

See `/home/asns/projects/climaticpro/docker-compose.yml` for Docker Compose configuration.
