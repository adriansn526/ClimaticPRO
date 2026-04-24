'use client';

import { motion } from 'framer-motion';
import { Calendar, Phone, Mail } from 'lucide-react';

export default function InstallationCTA() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block bg-white/30 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/40"
          >
            <span className="text-sm font-bold text-white drop-shadow-lg">Disponibilitate Limitată</span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white drop-shadow-xl"
          >
            Programează Instalarea Acum
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl mb-8 text-white font-semibold drop-shadow-lg"
          >
            Instalare profesională în 1-3 zile. Garanție montaj. Echipă autorizată.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <a
              href="#calendar"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('calendar');
                if (element) {
                  element.scrollIntoView({ behavior: 'auto' });
                }
              }}
              className="w-full sm:w-auto bg-white text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl flex items-center justify-center gap-2 border-2 border-white cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              Rezervă Slot în Calendar
            </a>
            <a
              href="tel:+40316060050"
              className="w-full sm:w-auto bg-white/20 backdrop-blur-md border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 shadow-xl"
            >
              <Phone className="w-5 h-5" />
              Sună: +40 316 060 050
            </a>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white font-semibold drop-shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <a href="tel:+40316060050" className="hover:text-white transition-colors">
                +40 316 060 050
              </a>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/50" />
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <a href="mailto:contact@climaticpro.ro" className="hover:text-white transition-colors">
                contact@climaticpro.ro
              </a>
            </div>
          </motion.div>

          {/* Trust Signal */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-sm text-white font-bold drop-shadow-lg"
          >
            <p>✓ Peste 1000 instalări realizate | ✓ Rating 4.9/5 | ✓ Garanție montaj</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
