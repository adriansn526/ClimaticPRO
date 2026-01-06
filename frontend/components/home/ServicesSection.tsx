'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const plans = [
  {
    key: 'standard',
    features: ['feature1', 'feature2', 'feature3'],
    popular: false,
  },
  {
    key: 'premium',
    features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'],
    popular: true,
  },
  {
    key: 'vip',
    features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'],
    popular: false,
  },
];

export default function ServicesSection() {
  const t = useTranslations('services');
  
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
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
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="success">⭐ Cel mai popular</Badge>
                </div>
              )}
              
              <Card 
                hover 
                className={`h-full ${plan.popular ? 'ring-2 ring-primary-500 shadow-2xl' : ''}`}
              >
                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {t(plan.key)}
                  </h3>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-primary-600">
                      {t(`${plan.key}Price`)}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 mb-6">
                    {t(`${plan.key}Desc`)}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <Button 
                    variant={plan.popular ? 'primary' : 'outline'} 
                    className="w-full"
                  >
                    {t('cta')}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
