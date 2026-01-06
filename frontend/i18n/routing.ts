import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro', 'en'],
  defaultLocale: 'ro',
  localePrefix: 'as-needed', // RO fără prefix, EN cu /en
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
