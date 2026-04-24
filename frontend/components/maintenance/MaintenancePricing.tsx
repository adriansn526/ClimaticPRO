'use client';

import { motion } from 'framer-motion';
import { Check, Info, ShieldAlert } from 'lucide-react';

export default function MaintenancePricing() {
  const standardFeatures = [
    'Curățare filtre și carcasă frontală',
    'Igienizare vaporizator cu spray antibacterian',
    'Verificare parametri funcționare',
    'Deplasare gratuită (București)',
  ];

  const premiumFeatures = [
    'Demontare carcasă unitate interioară',
    'Spălare cu presiune (folosind husă colectoare)',
    'Curățare turbină / ventilator',
    'Igienizare cu soluții profesionale biocide',
    'Verificare presiune freon',
  ];

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pachete și Prețuri Transparente
            </h2>
            <p className="text-lg text-gray-600">
              Alege pachetul potrivit nevoilor tale. Fără costuri ascunse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Standard */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white border rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-8 flex flex-col"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Igienizare Standard</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">150 RON</div>
                <p className="text-gray-500 text-sm">Mentenanță anuală de bază</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {standardFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feat}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-emerald-50 w-full border-2 border-emerald-500 rounded-2xl shadow-xl p-8 relative flex flex-col mx-auto"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                Recomandat
              </div>
              <div className="text-center mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Igienizare Premium</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">290 RON</div>
                <p className="text-gray-600 text-sm">Curățare profundă pentru aer 100% curat</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {premiumFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-800 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-orange-900 text-lg mb-2">Taxă Diagnoză / Constatare: 150 RON</h4>
              <p className="text-orange-800 text-sm leading-relaxed">
                Dacă aparatul dumneavoastră este defect, se aplică o taxă de constatare de 150 RON pentru deplasarea în București și Ilfov. 
                <strong> Notă importantă:</strong> Această taxă se achită doar dacă se refuză reparația. Dacă se acceptă reparația, taxa de constatare se poate deduce parțial sau integral din costul manoperei.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
