'use client';

import { Truck, Shield, Headphones, Wrench } from 'lucide-react';

const badges = [
  {
    icon: Truck,
    title: 'Livrare gratuită București & Ilfov',
    subtitle: '*Pentru aparatele instalate de noi',
  },
  {
    icon: Shield,
    title: 'Servicii garantate',
    subtitle: 'executate de profesionisti',
  },
  {
    icon: Headphones,
    title: 'Suport telefonic si online',
  },
  {
    icon: Wrench,
    title: 'Instalare Profesională',
    subtitle: 'Montaj rapid și curat',
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-gray-50 py-8 border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{badge.title}</h3>
                {badge.subtitle && (
                  <p className="text-sm text-gray-600">{badge.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
