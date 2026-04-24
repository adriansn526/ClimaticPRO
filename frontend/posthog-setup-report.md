<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the ClimaticPro Next.js 15 App Router project. PostHog is initialized client-side via `instrumentation-client.ts` (Next.js 15.3+ recommended approach), with a reverse proxy configured in `next.config.ts` to route events through `/ingest` for better ad-blocker resilience. A server-side client (`lib/posthog-server.ts`) handles API route tracking using `posthog-node`. Environment variables are stored in `.env.local`. 15 events are tracked across 10 files, covering the full user journey from search and product discovery through checkout, installation booking, and TBI financing.

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully logs in; calls `posthog.identify()` with email and role | `app/[locale]/cont/login/page.tsx` |
| `user_registered` | User creates a new account (customer or installer); calls `posthog.identify()` | `app/[locale]/cont/inregistrare/page.tsx` |
| `product_added_to_cart` | Product added to cart from product detail page, with price, quantity, brand | `components/products/ProductInfo.tsx` |
| `installation_requested` | User clicks "Solicită Instalare" on a product page | `components/products/ProductInfo.tsx` |
| `tbi_calculator_opened` | User opens the TBI financing calculator modal | `components/products/ProductInfo.tsx` |
| `product_removed_from_cart` | Product removed from cart, with product details | `contexts/CartContext.tsx` |
| `search_performed` | User submits a search query, captures query and result count | `components/search/SearchWithSuggestions.tsx` |
| `search_product_selected` | User clicks a product from the search suggestions dropdown | `components/search/SearchWithSuggestions.tsx` |
| `product_added_to_wishlist` | Product added to wishlist (favorites) | `components/wishlist/WishlistButton.tsx` |
| `product_removed_from_wishlist` | Product removed from wishlist | `components/wishlist/WishlistButton.tsx` |
| `checkout_started` | User arrives at checkout with items in cart (fires once on mount) | `app/[locale]/checkout/page.tsx` |
| `checkout_completed` | User successfully submits the checkout form | `app/[locale]/checkout/page.tsx` |
| `order_created` | Order successfully created in WooCommerce (server-side) | `app/api/order/route.ts` |
| `installation_booking_created` | Installation booking created in WooCommerce (server-side) | `app/api/bookings/woocommerce/route.ts` |
| `tbi_financing_initiated` | TBI financing flow initiated, user redirected to TBI (server-side) | `app/api/tbi/init/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://eu.posthog.com/project/96567/dashboard/551742)
- **Checkout Conversion Funnel** — checkout_started → checkout_completed → order_created: [View insight](https://eu.posthog.com/project/96567/insights/QXuIDxgm)
- **Product Engagement** — add to cart, installation requests, wishlist trends: [View insight](https://eu.posthog.com/project/96567/insights/doRNbo7S)
- **New User Registrations** — daily sign-ups by customer vs installer: [View insight](https://eu.posthog.com/project/96567/insights/hngnw9Hm)
- **Revenue Signals** — orders, installation bookings, and TBI financing weekly: [View insight](https://eu.posthog.com/project/96567/insights/ArT7EEZt)
- **Search to Purchase Funnel** — search → product selected → cart → checkout: [View insight](https://eu.posthog.com/project/96567/insights/6rjkSwIQ)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
