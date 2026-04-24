'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function FinalCTA() {
  const t = useTranslations('cta');

  return (
    <section className="py-20 bg-[#0052a3] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            {t('title')}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-10"
          >
            {t('subtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100 shadow-xl"
            >
              {t('button')}
            </Button>

            <div className="flex items-center text-white">
              <span className="mr-3">{t('phone')}</span>
              <a
                href="tel:+40316060050"
                className="flex items-center font-bold text-lg hover:text-white/80 transition-colors"
              >
                <Phone className="w-5 h-5 mr-2" />
                +40 316 060 050
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
