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
    <section className="py-20 bg-white">
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {spaces.map((space, index) => (
            <motion.div
              key={space.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={space.href}>
                <Card hover className="h-full group cursor-pointer">
                  <div className="p-4 sm:p-6">
                    {/* Icon with gradient background */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${space.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <space.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-primary-600 transition-colors">
                      {t(space.key)}
                    </h3>
                    
                    {/* BTU Range & Area */}
                    <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        {space.btuRange}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {space.area}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                      {t.raw(`${space.key}Features`).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start text-xs sm:text-sm text-gray-600">
                          <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <div className="flex items-center text-primary-500 font-semibold text-xs sm:text-sm group-hover:translate-x-2 transition-transform">
                      <span className="mr-2">Vezi produse</span>
                      <span>→</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
