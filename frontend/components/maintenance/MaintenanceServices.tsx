'use client';

import { motion } from 'framer-motion';
import { Droplets, ThermometerSnowflake, VolumeX, AlertTriangle } from 'lucide-react';

export default function MaintenanceServices() {
  const problems = [
    {
      icon: Droplets,
      title: 'Curge apă din unitatea interioară',
      description: 'Cea mai frecventă problemă, cauzată de obicei de înfundarea furtunului de condens sau lipsa mentenanței.',
    },
    {
      icon: ThermometerSnowflake,
      title: 'Nu mai răcește / încălzește suficient',
      description: 'Poate fi din cauza filtrelor îmbâcsite, lipsa freonului sau o problemă la compresor.',
    },
    {
      icon: VolumeX,
      title: 'Zgomote neobișnuite',
      description: 'Aparatul vibrează puternic sau scoate sunete ciudate la pornire? Verificăm turbina și subansamblele.',
    },
    {
      icon: AlertTriangle,
      title: 'Erori afișate pe display',
      description: 'Diagnoză pe loc pentru erorile afișate, verificăm placa electronică și senzorii.',
    },
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Probleme frecvente pe care le rezolvăm
          </h2>
          <p className="text-lg text-gray-600">
            Aparatul tău dă semne de oboseală? Echipa noastră este pregătită pentru orice situație.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {problems.map((prob, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-colors border border-gray-100 hover:border-emerald-100 group"
            >
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                <prob.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{prob.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {prob.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
