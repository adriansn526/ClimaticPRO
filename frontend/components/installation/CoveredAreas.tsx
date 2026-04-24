'use client';

import { motion } from 'framer-motion';
import { MapPin, Check } from 'lucide-react';

export default function CoveredAreas() {
  const bucuresti = [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6'
  ];

  const ilfov = [
    'Voluntari', 'Popești-Leordeni', 'Bragadiru', 'Pantelimon',
    'Chiajna', 'Otopeni', 'Măgurele', 'Buftea', 'Corbeanca',
    'Domnești', 'Jilava', 'Mogoșoaia', 'Chitila', 'Clinceni'
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Zone Acoperite
            </h2>
            <p className="text-lg text-gray-600">
              Instalăm în București și Ilfov
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* București */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8 border border-primary-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">București</h3>
                  <p className="text-sm text-gray-600">Toate sectoarele</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {bucuresti.map((sector, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{sector}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-primary-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Taxă deplasare:</span>
                  <span className="text-xl font-bold text-green-600">0 RON</span>
                </div>
              </div>
            </motion.div>

            {/* Ilfov */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Ilfov</h3>
                  <p className="text-sm text-gray-600">Localități principale</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {ilfov.map((localitate, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{localitate}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Taxă deplasare:</span>
                  <span className="text-xl font-bold text-orange-600">50 RON</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200 text-center"
          >
            <p className="text-gray-700">
              <strong>Nu găsești localitatea ta?</strong> Sună-ne la{' '}
              <a href="tel:+40316060050" className="text-primary-600 font-bold hover:underline">
                +40 316 060 050
              </a>{' '}
              pentru a verifica disponibilitatea în zona ta.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
