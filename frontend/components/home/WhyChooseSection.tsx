'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Shield, Truck } from 'lucide-react';

const features = [
  { key: 'experience', icon: Award, color: 'text-primary-500' },
  { key: 'installations', icon: TrendingUp, color: 'text-secondary-500' },
  { key: 'warranty', icon: Shield, color: 'text-green-500' },
  { key: 'delivery', icon: Truck, color: 'text-accent-500' },
];

export default function WhyChooseSection() {
  const t = useTranslations('whyChoose');
  
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
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block mb-4"
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-10 h-10" />
                </div>
              </motion.div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold mb-2 text-gray-900">
                {t(feature.key)}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600">
                {t(`${feature.key}Desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
