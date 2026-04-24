'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

export default function InstallationPricing() {
  const [pricingMode, setPricingMode] = useState<'fixed'|'from'|'loading'>('loading');
  const [price12k, setPrice12k] = useState(950);
  const [extraCustomServices, setExtraCustomServices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/pricing')
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setPricingMode(data.mode);
          setPrice12k(data.price12k);
          if (data.extraServices && data.extraServices.length > 0) {
            setExtraCustomServices(data.extraServices);
          }
        } else {
          setPricingMode('fixed');
        }
      })
      .catch(() => setPricingMode('fixed'));
  }, []);

  const baseServices = [
    'Traseu frigorific 3m (țevi cupru izolate)',
    'Cablu comandă și alimentare UE 3m',
    'Furtun condens 3m',
    'Console fixare UE + dibluri',
    'Bandă matisare',
    'Șuruburi fixare + șaibe + piulițe',
    'Stecher',
    'Vacumare instalație',
    'Probă funcționare',
    'Garanție montaj (egală cu garanția aparatului)',
  ];

  const defaultExtraServices = [
    { name: 'Traseu frigorific suplimentar (peste 3m)', price: '100 RON/ml' },
    { name: 'Mascare traseu cu mască PVC', price: '50 RON/ml' },
    { name: 'Prelungire cablu alimentare', price: '10 RON/ml' },
    { name: 'Prelungire furtun condens', price: '5 RON/ml' },
    { name: 'Demontare AC existent', price: '150 RON' },
    { name: 'Trecere suplimentară prin beton/zidărie', price: 'Gratuit' },
  ];

  const displayExtra = extraCustomServices.length > 0 
    ? extraCustomServices.map(ex => ({ 
        name: ex.name, 
        price: `${pricingMode === 'from' ? 'De la ' : ''}${ex.price} RON${ex.unit ? '/' + ex.unit : ''}` 
      }))
    : defaultExtraServices;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Prețuri Transparente
            </h2>
            <p className="text-lg text-gray-600">
              Fără costuri ascunse. Știi exact ce plătești.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preț Bază */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="text-center mb-6">
                <div className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Instalare Standard
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {pricingMode === 'loading' ? '...' : (
                    <span>
                      {pricingMode === 'from' && <span className="text-2xl mr-2">De la</span>}
                      {price12k} RON
                    </span>
                  )}
                </div>
                <p className="text-gray-600">Pentru segmentul 9000-12000 BTU</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Include în preț:</h3>
                {baseServices.map((service, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{service}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Prețul include toate materialele și manopera necesare pentru punerea în funcțiune a aparatului în limita kit-ului de 3m.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Servicii Extra */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Servicii Suplimentare</h3>
                <p className="text-gray-600">Opționale, în funcție de necesități</p>
              </div>

              <div className="space-y-4">
                {displayExtra.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <span className="text-gray-900 text-sm font-semibold flex-1">
                      {service.name}
                    </span>
                    <span className="text-primary-600 font-bold text-base ml-4 drop-shadow-sm text-right">
                      {service.price}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900">
                  <strong>Notă:</strong> Serviciile suplimentare se stabilesc la evaluarea locației și se plătesc separat doar dacă sunt necesare.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Pachet Aparat + Instalare */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-xl shadow-xl p-8 text-white"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Pachet Special: Aparat + Instalare</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Reducere 10% la instalare</p>
                </div>
                <div>
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Transport gratuit</p>
                </div>
                <div>
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Garanție extinsă 3 ani</p>
                </div>
              </div>
              <a
                href="#recomandari"
                className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Vezi Aparate Recomandate
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
