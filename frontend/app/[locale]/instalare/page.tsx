import { Metadata } from 'next';
import InstallationHero from '@/components/installation/InstallationHero';
import HowItWorks from '@/components/installation/HowItWorks';

import InstallationPricing from '@/components/installation/InstallationPricing';
import InstallationProcess from '@/components/installation/InstallationProcess';
import WhyChooseUs from '@/components/installation/WhyChooseUs';
import InstallationFAQ from '@/components/installation/InstallationFAQ';
import CoveredAreas from '@/components/installation/CoveredAreas';
import InstallationCTA from '@/components/installation/InstallationCTA';

export const metadata: Metadata = {
  title: 'Instalare Aer Condiționat București | Programare Online | Garanție Montaj',
  description: 'Instalare profesională aer condiționat în București și Ilfov. Programare online simplă, echipă autorizată RAR, garanție montaj egală cu garanția aparatului. Preț fix de la 299 RON.',
  keywords: [
    'instalare aer conditionat bucuresti',
    'montaj aer conditionat',
    'programare instalare ac',
    'instalare clima bucuresti',
    'montaj clima ilfov',
    'instalare aer conditionat pret',
    'montaj profesional ac',
    'instalare aer conditionat rapid',
  ],
  openGraph: {
    title: 'Instalare Aer Condiționat București - Programare Online',
    description: 'Montaj profesional în 1-3 zile | Garanție montaj | Preț fix 299 RON | Echipă autorizată',
    images: ['/og-instalare.jpg'],
    type: 'website',
  },
};

export default function InstalarePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <InstallationHero />

      {/* Cum Funcționează - 3 Pași */}
      <HowItWorks />



      {/* Prețuri Transparente */}
      <InstallationPricing />

      {/* Proces Instalare */}
      <InstallationProcess />

      {/* De Ce Să Ne Alegi */}
      <WhyChooseUs />

      {/* FAQ */}
      <InstallationFAQ />

      {/* Zone Acoperite */}
      <CoveredAreas />

      {/* CTA Final */}
      <InstallationCTA />

      {/* Schema Markup pentru SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Instalare Aer Condiționat',
            description: 'Instalare profesională aer condiționat în București și Ilfov',
            provider: {
              '@type': 'LocalBusiness',
              name: 'ClimaticPro',
              telephone: '+40316060024',
              email: 'contact@climaticpro.ro',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'București',
                addressCountry: 'RO',
              },
              areaServed: ['București', 'Ilfov'],
            },
            offers: {
              '@type': 'Offer',
              price: '299',
              priceCurrency: 'RON',
              description: 'Instalare standard aer condiționat',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '200',
            },
          }),
        }}
      />
    </main>
  );
}
