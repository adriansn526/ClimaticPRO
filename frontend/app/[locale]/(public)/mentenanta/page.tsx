import { Metadata } from 'next';
import MaintenanceHero from '@/components/maintenance/MaintenanceHero';
import MaintenanceHowItWorks from '@/components/maintenance/MaintenanceHowItWorks';
import MaintenanceServices from '@/components/maintenance/MaintenanceServices';
import MaintenancePricing from '@/components/maintenance/MaintenancePricing';
import MaintenanceWhyChooseUs from '@/components/maintenance/MaintenanceWhyChooseUs';
import MaintenanceFAQ from '@/components/maintenance/MaintenanceFAQ';
import MaintenanceCTA from '@/components/maintenance/MaintenanceCTA';
import CoveredAreas from '@/components/installation/CoveredAreas';

export const metadata: Metadata = {
  title: 'Igienizare și Reparații Aer Condiționat București | ClimaticPro',
  description: 'Servicii profesionale de igienizare, mentenanță și reparații aer condiționat în București și Ilfov. Intervenție rapidă, garanție pe piese.',
  keywords: [
    'igienizare aer conditionat',
    'curatare ac bucuresti',
    'reparatii aer conditionat',
    'incarcare freon',
    'revizie aer conditionat',
    'service aer conditionat ilfov',
    'igienizare profesionala',
    'mentenanta ac'
  ],
  openGraph: {
    title: 'Igienizare și Reparații Aer Condiționat - ClimaticPro',
    description: 'Servicii profesionale de igienizare, mentenanță și reparații. Intervenție rapidă în București și Ilfov.',
    type: 'website',
  },
};

export default function MentenantaPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <MaintenanceHero />

      {/* Probleme pe care le rezolvam */}
      <MaintenanceServices />

      {/* Cum Funcționează */}
      <MaintenanceHowItWorks />

      {/* Prețuri Transparente */}
      <MaintenancePricing />

      {/* De Ce Să Ne Alegi */}
      <MaintenanceWhyChooseUs />

      {/* FAQ */}
      <MaintenanceFAQ />

      {/* Zone Acoperite */}
      <CoveredAreas />

      {/* CTA Final */}
      <MaintenanceCTA />

      {/* Schema Markup for LocalBusiness/Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Igienizare și Reparații Aer Condiționat',
            description: 'Servicii profesionale de igienizare, mentenanță și reparații aer condiționat în București și Ilfov',
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
            offers: [
              {
                '@type': 'Offer',
                price: '150',
                priceCurrency: 'RON',
                name: 'Igienizare Standard Aer Condiționat',
              },
              {
                '@type': 'Offer',
                price: '290',
                priceCurrency: 'RON',
                name: 'Igienizare Premium Aer Condiționat',
              }
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '150',
            },
          }),
        }}
      />
    </main>
  );
}
