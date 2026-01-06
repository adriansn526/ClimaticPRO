import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import "@/app/globals.css";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ClimaticPro - Aer Condiționat + Instalare Profesională",
  description: "78+ modele aer condiționat Gree, Daikin, Midea cu instalare profesională în 24h. Garanție 5 ani. Livrare gratuită.",
  keywords: ["aer conditionat", "instalare aer conditionat", "gree", "daikin", "midea", "bucuresti", "climatizare"],
  authors: [{ name: "ClimaticPro" }],
  openGraph: {
    title: "ClimaticPro - Aer Condiționat + Instalare Profesională",
    description: "78+ modele aer condiționat Gree, Daikin, Midea cu instalare profesională în 24h",
    url: "https://cms.climaticpro.ro",
    siteName: "ClimaticPro",
    locale: "ro_RO",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale: 'ro' });

  return (
    <html lang="ro" className={inter.variable}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages} locale="ro">
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
