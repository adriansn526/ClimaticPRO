import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // - ... the ones starting with `/ingest` for PostHog
  matcher: ['/((?!api|s|_next|_vercel|ingest|.*\\..*).*)']
};
