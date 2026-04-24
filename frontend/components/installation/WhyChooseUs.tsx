'use client';

import { motion } from 'framer-motion';
import { Shield, Clock, Award, DollarSign, Headphones, CreditCard } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    {
      icon: Award,
      title: 'Echipă Autorizată',
      description: 'Certificare RAR, experiență 20+ ani în instalări profesionale de aer condiționat.',
    },
    {
      icon: Shield,
      title: 'Garanție Montaj',
      description: 'Garanție la lucrările de instalare egală cu garanția aparatului. Siguranță maximă.',
    },
    {
      icon: Clock,
      title: 'Instalare Rapidă',
      description: 'Programare în 1-3 zile de la comandă. Montaj complet în 2-3 ore.',
    },
    {
      icon: DollarSign,
      title: 'Prețuri Fixe',
      description: 'Fără costuri ascunse. Ofertă clară și transparentă de la început.',
    },
    {
      icon: Headphones,
      title: 'Service Post-Vânzare',
      description: 'Suport tehnic permanent, revizie gratuită în primul an de utilizare.',
    },
    {
      icon: CreditCard,
      title: 'Plată Flexibilă',
      description: 'Online, cash, card la instalare sau în rate prin partenerul nostru bancar.',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              De Ce Să Ne Alegi
            </h2>
            <p className="text-lg text-gray-600">
              Peste 500 de clienți mulțumiți ne recomandă
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <reason.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{reason.title}</h3>
                <p className="text-gray-600">{reason.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            {[
              { value: '20+', label: 'Ani Experiență' },
              { value: '1000+', label: 'Instalări' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
