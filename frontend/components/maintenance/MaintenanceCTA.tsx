'use client';

import { Phone } from 'lucide-react';

export default function MaintenanceCTA() {
  return (
    <section className="py-20 bg-emerald-600 text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-6">
          Aparatul tău are nevoie de atenție?
        </h2>
        <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
          Nu lăsa problemele minore să se transforme în reparații costisitoare. Sună acum pentru o programare rapidă în București și Ilfov.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+40316060024"
            className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Phone className="w-5 h-5" /> 031 606 0024
          </a>
          <a
            href="/contact"
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors w-full sm:w-auto justify-center"
          >
            Lasă-ne un mesaj
          </a>
        </div>
      </div>
    </section>
  );
}
