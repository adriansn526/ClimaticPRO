'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Bed, Sofa, Briefcase, Building2, Home, Building } from 'lucide-react';
import Card from '@/components/ui/Card';
import Link from 'next/link';

const spaces = [
  {
    key: 'bedroom',
    icon: Bed,
    color: 'from-blue-500 to-blue-600',
    btuRange: '9-12k BTU',
    area: '15-35m²',
    href: '/produse?btu_min=9000&btu_max=12000'
  },
  {
    key: 'living',
    icon: Sofa,
    color: 'from-primary-500 to-primary-600',
    btuRange: '12-18k BTU',
    area: '25-50m²',
    href: '/produse?btu_min=12000&btu_max=18000'
  },
  {
    key: 'office',
    icon: Briefcase,
    color: 'from-purple-500 to-purple-600',
    btuRange: '9-12k BTU',
    area: '15-30m²',
    href: '/produse?btu_min=9000&btu_max=12000'
  },
  {
    key: 'commercial',
    icon: Building2,
    color: 'from-orange-500 to-orange-600',
    btuRange: '18-24k+ BTU',
    area: '50m²+',
    href: '/produse?btu_min=18000'
  },
  {
    key: 'house',
    icon: Home,
    color: 'from-green-500 to-green-600',
    btuRange: 'Multi-split',
    area: '100-200m²',
    href: '/produse?type=multi-split'
  },
  {
    key: 'apartment',
    icon: Building,
    color: 'from-teal-500 to-teal-600',
    btuRange: 'Multi-split',
    area: '50-100m²',
    href: '/produse?type=multi-split'
  },
];

export default function CategoriesGrid() {
  const t = useTranslations('categories');

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-900"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space, index) => (
            <motion.div
              key={space.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={space.href} className="block group h-full">
                <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
                  {/* Background Gradient/Image Placeholder */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${space.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />

                  {/* Glass Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-white/50 transition-colors duration-300 group-hover:bg-white/90">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${space.color} text-white`}>
                          <space.icon className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recomandat</p>
                          <p className="text-sm font-bold text-gray-900">{space.btuRange}</p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {t(space.key)}
                      </h3>

                      <ul className="space-y-1 mb-4">
                        {t.raw(`${space.key}Features`).slice(0, 2).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        Vezi opțiuni <span className="ml-1">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
