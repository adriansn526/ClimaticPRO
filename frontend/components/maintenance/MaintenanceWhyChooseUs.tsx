'use client';

import { motion } from 'framer-motion';
import { Shield, Settings, Zap, Users } from 'lucide-react';

export default function MaintenanceWhyChooseUs() {
  const reasons = [
    {
      icon: Users,
      title: 'Echipă Specializată',
      description: 'Tehnicieni cu experiență pe multiple branduri (Daikin, Gree, Midea, etc).',
    },
    {
      icon: Settings,
      title: 'Aparatură Profesională',
      description: 'Folosim aparate speciale pentru spălare cu presiune și pompe de vacuum.',
    },
    {
      icon: Shield,
      title: 'Soluții Avizate MS',
      description: 'Igienizăm cu biocide și detergenți avizați de Ministerul Sănătății.',
    },
    {
      icon: Zap,
      title: 'Intervenție Rapidă',
      description: 'Știm cât de important este confortul tău. Ne deplasăm rapid în București și Ilfov.',
    },
  ];

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">De ce să ne alegi pe noi?</h2>
          <p className="text-gray-400 text-lg">Ne pasă de sănătatea ta și de confortul casei tale.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-emerald-500/50 transition-colors text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-6">
                <reason.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
