'use client';

import { motion } from 'framer-motion';
import { Calendar, ShoppingCart, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Calendar,
      title: 'Alege Data',
      description: 'Selectează data dorită din calendar. Verificăm disponibilitatea în timp real.',
    },
    {
      icon: ShoppingCart,
      title: 'Selectează Aparat',
      description: 'Ai deja aparat sau vrei să cumperi de la noi? Îți recomandăm produsul potrivit.',
    },
    {
      icon: CheckCircle,
      title: 'Confirmă Programarea',
      description: 'Completează datele și confirmă. Primești email și SMS cu detaliile instalării.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cum Funcționează?
          </h2>
          <p className="text-lg text-gray-600">
            Programează instalarea în doar 3 pași simpli
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-primary-200 z-0" />
              )}

              {/* Step Card */}
              <div className="relative bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow z-10">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                  <step.icon className="w-8 h-8 text-primary-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
