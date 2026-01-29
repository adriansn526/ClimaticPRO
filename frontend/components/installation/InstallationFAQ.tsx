'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function InstallationFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Cât durează instalarea unui aer condiționat?',
      answer: 'Instalarea standard durează aproximativ 2-3 ore, în funcție de complexitatea locației. Echipa noastră lucrează eficient pentru a minimiza timpul de așteptare.',
    },
    {
      question: 'Ce include prețul de 950 RON pentru instalare?',
      answer: 'Prețul include: kit instalare 3m (țevi cupru, cabluri, furtun condens), console fixare, bandă matisare, șuruburi, stecher, vacumare instalație, probă funcționare și garanție montaj egală cu garanția aparatului.',
    },
    {
      question: 'Trebuie să fiu acasă în timpul instalării?',
      answer: 'Da, este necesar să fiți prezent pentru a permite accesul echipei și pentru a primi instrucțiunile de utilizare la finalul instalării. Echipa va suna cu 30 minute înainte de sosire.',
    },
    {
      question: 'Aveți garanție la montaj?',
      answer: 'Da, oferim garanție la lucrările de instalare egală cu garanția aparatului. Aceasta acoperă orice defecțiuni cauzate de montaj.',
    },
    {
      question: 'Pot reprograma instalarea?',
      answer: 'Da, poți reprograma instalarea cu minim 24 de ore înainte de data programată, fără costuri suplimentare. Contactează-ne telefonic sau prin email.',
    },
    {
      question: 'Acceptați plata cu cardul?',
      answer: 'Da, acceptăm plata online, cu cardul la instalare, cash sau în rate prin partenerul nostru bancar. Alegi metoda de plată la finalizarea programării.',
    },
    {
      question: 'Instalați și în weekend?',
      answer: 'Nu, instalările se efectuează doar în zilele lucrătoare (Luni-Vineri), între orele 09:00-17:00. Weekend-urile sunt închise pentru instalări.',
    },
    {
      question: 'Ce fac dacă am probleme după instalare?',
      answer: 'Contactează-ne imediat la 0316 060 024. Oferim suport tehnic permanent și intervenție rapidă în caz de probleme legate de montaj. Prima revizie în primul an este gratuită.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Întrebări Frecvente
            </h2>
            <p className="text-lg text-gray-600">
              Răspunsuri la cele mai comune întrebări despre instalare
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center bg-primary-50 rounded-xl p-6 border border-primary-200"
          >
            <p className="text-gray-700 mb-4">
              Nu ai găsit răspunsul? Suntem aici să te ajutăm!
            </p>
            <a
              href="tel:+40316060024"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Sună acum: 0316 060 024
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
