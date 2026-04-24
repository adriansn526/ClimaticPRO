'use client';

import { motion } from 'framer-motion';
import { PhoneCall, Search, Sparkles } from 'lucide-react';

export default function MaintenanceHowItWorks() {
  const steps = [
    {
      icon: PhoneCall,
      title: 'Programare Rapidă',
      description: 'Ne suni sau completezi formularul, iar noi stabilim intervenția în cel mai scurt timp.',
    },
    {
      icon: Search,
      title: 'Diagnoză / Constatare',
      description: 'Echipa noastră evaluează starea aparatului și îți comunică exact pașii necesari.',
    },
    {
      icon: Sparkles,
      title: 'Intervenție Profesională',
      description: 'Efectuăm igienizarea sau reparația folosind echipamente și soluții de top.',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cum Funcționează?
          </h2>
          <p className="text-lg text-gray-600">
            3 pași simpli pentru un aer condiționat curat și funcțional
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
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-emerald-200 z-0" />
              )}

              <div className="relative bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow z-10 border border-gray-100">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {index + 1}
                </div>

                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                  <step.icon className="w-8 h-8 text-emerald-600" />
                </div>

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
