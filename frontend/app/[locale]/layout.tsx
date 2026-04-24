import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Outfit } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CSPostHogProvider } from '@/app/providers';
import SuspendedPostHogPageView from '@/app/PostHogPageView';
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://climaticpro.ro'),
  title: {
    template: '%s | ClimaticPro',
    default: 'ClimaticPro - Aer Condiționat + Instalare Profesională',
  },
  description: "78+ modele aer condiționat Gree, Daikin, Midea cu instalare profesională în 24h. Garanție 5 ani. Livrare gratuită.",
  keywords: ["aer conditionat", "instalare aer conditionat", "gree", "daikin", "midea", "bucuresti", "climatizare"],
  authors: [{ name: "ClimaticPro" }],
  openGraph: {
    title: "ClimaticPro - Aer Condiționat + Instalare Profesională",
    description: "78+ modele aer condiționat Gree, Daikin, Midea cu instalare profesională în 24h",
    url: "https://climaticpro.ro",
    siteName: "ClimaticPro",
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ClimaticPro Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClimaticPro - Aer Condiționat',
    description: 'Instalare profesională în 24h.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};


export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={outfit.variable} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <CSPostHogProvider>
                  <SuspendedPostHogPageView />
                  {children}
                </CSPostHogProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
