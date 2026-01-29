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
    features: ['feature1', 'feature2', 'feature3', 'feature6'],
    popular: true,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                className={`h-full border border-gray-200 flex flex-col overflow-hidden ${plan.popular ? 'ring-2 ring-primary-600 shadow-xl relative' : 'shadow-lg'}`}
              >
                {/* Header Section */}
                <div className={`p-8 text-center border-b border-gray-100 ${plan.popular ? 'bg-primary-50' : 'bg-gray-50'}`}>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {t(plan.key)}
                  </h3>

                  {/* Price */}
                  <div className="my-4">
                    <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                      {t(`${plan.key}Price`)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 font-medium">
                    {t(`${plan.key}Desc`)}
                  </p>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  {/* Features List */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className={`p-1 rounded-full mr-3 flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-primary-100' : 'bg-green-100'}`}>
                          <Check className={`w-3 h-3 ${plan.popular ? 'text-primary-700' : 'text-green-700'}`} />
                        </div>
                        <span className="text-gray-900 font-medium">{t(feature)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className={`w-full py-3 font-bold text-lg ${plan.popular
                        ? '!bg-[#0052a3] !text-white hover:!bg-[#003d7a] shadow-lg hover:shadow-xl border-none ring-0'
                        : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50'
                      }`}
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
