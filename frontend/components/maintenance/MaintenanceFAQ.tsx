'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function MaintenanceFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Cât de des trebuie să fac igienizarea aparatului de aer condiționat?',
      a: 'Recomandăm igienizarea aparatului cel puțin o dată pe an, ideal primăvara, înainte de începerea sezonului cald. Dacă aparatul este folosit și iarna pentru încălzire, recomandăm două igienizări pe an.',
    },
    {
      q: 'Pot să spăl filtrele singur. E suficient?',
      a: 'Spălarea filtrelor de către client este recomandată lunar, dar nu este suficientă. Bacteriile și mucegaiul se dezvoltă pe vaporizator (radiatorul din spatele filtrelor) și pe turbină. Acestea necesită soluții profesionale și spălare sub presiune.',
    },
    {
      q: 'Cât durează intervenția?',
      a: 'O igienizare premium durează în medie 45-60 de minute. Pentru constatare și reparații, durata variază în funcție de complexitatea problemei (30 minute - 2 ore).',
    },
    {
      q: 'Reîncărcați cu freon (agent frigorific)?',
      a: 'Da. Totuși, lipsa freonului indică de obicei o pierdere în instalație. Reîncărcarea se face doar după ce am identificat și remediat pricina (ex. am refăcut bercluirile la conexiuni).',
    },
    {
      q: 'Oferiți garanție pentru reparații?',
      a: 'Da. Oferim garanție atât pentru manoperă, cât și pentru piesele înlocuite (compresor, placă electronică, senzori etc) conform reglementărilor legale în vigoare.',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Întrebări Frecvente</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
              >
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900 pr-8">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-600 text-sm">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
