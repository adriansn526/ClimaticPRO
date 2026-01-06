'use client';

import { motion } from 'framer-motion';
import { ClipboardCheck, Wrench, TestTube, GraduationCap } from 'lucide-react';

export default function InstallationProcess() {
  const steps = [
    {
      icon: ClipboardCheck,
      title: 'Evaluare Locație',
      description: 'Verificare perete, priză electrică, spațiu pentru unitatea exterioară și măsurare traseu frigorific.',
    },
    {
      icon: Wrench,
      title: 'Montaj Unități',
      description: 'Fixare suporturi, montaj unitate interioară și exterioară, executare găuri și trecere traseu frigorific.',
    },
    {
      icon: TestTube,
      title: 'Racordare & Testare',
      description: 'Conectare electrică, vacumare instalație, testare funcționare și verificare parametri.',
    },
    {
      icon: GraduationCap,
      title: 'Instruire & Predare',
      description: 'Demonstrație telecomandă, sfaturi întreținere, predare documentație și certificat garanție.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Cum Decurge Instalarea
            </h2>
            <p className="text-lg text-gray-600">
              Proces profesional în 4 pași simpli
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>

                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    {/* Step Number */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">{index + 1}</span>
                    </div>
                  </div>

                  {/* Spacer for alignment */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl p-6 border border-primary-200"
          >
            <h3 className="font-bold text-gray-900 mb-4">Detalii importante despre instalare:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Echipa va purta în permanență acoperitori peste încălțăminte și va folosi aspiratorul</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Reparația străpungerii (ipsos/silicon alb) este gratuită</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Instalarea se face respectând legislația (nu se perforează grinzi sau stâlpi de beton)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Unitatea exterioară se fixează cât mai aproape de cea interioară, într-un loc accesibil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Echipa va suna cu 30 minute înainte de sosire</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
