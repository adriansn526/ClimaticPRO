import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro'], // removed 'en' to eliminate slugs
  defaultLocale: 'ro',
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
