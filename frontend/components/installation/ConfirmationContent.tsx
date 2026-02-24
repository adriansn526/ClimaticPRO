'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Package, MapPin, Phone, Mail, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Programare Confirmată! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Comanda ta a fost înregistrată cu succes.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mt-2">
                Număr comandă: <span className="font-mono font-bold text-cyan-600">#{orderId}</span>
              </p>
            )}
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ce urmează?</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">1. Verifică email-ul</h3>
                  <p className="text-gray-600 text-sm">
                    Vei primi un email de confirmare cu toate detaliile programării în maxim 5 minute.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">2. Confirmare telefonică</h3>
                  <p className="text-gray-600 text-sm">
                    Echipa noastră te va contacta în următoarele 24h pentru a confirma detaliile instalării.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">3. Ziua instalării</h3>
                  <p className="text-gray-600 text-sm">
                    Echipa va suna cu 30 minute înainte de sosire. Instalarea durează aproximativ 2-3 ore.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">4. Finalizare și garanție</h3>
                  <p className="text-gray-600 text-sm">
                    După instalare, vei primi documentele de garanție și instrucțiunile de utilizare.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Important Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Informații importante
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Asigură-te că locația este accesibilă și pregătită pentru instalare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Echipa va aduce toate uneltele și materialele necesare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Plata se poate face cash sau transfer bancar la finalizarea instalării</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Poți reprograma cu minim 24h înainte sunând la +40 316 300 101</span>
              </li>
            </ul>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white mb-6"
          >
            <h3 className="font-bold mb-4">Ai întrebări?</h3>
            <div className="space-y-3">
              <a href="tel:+40316300101" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Phone className="w-5 h-5" />
                <span className="font-semibold">+40 316 300 101</span>
              </a>
              <a href="mailto:contact@climaticpro.ro" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">contact@climaticpro.ro</span>
              </a>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-cyan-500 hover:text-cyan-600 transition-all"
            >
              Înapoi la pagina principală
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={() => {
                const storedData = localStorage.getItem('bookingData');
                if (storedData && orderId) {
                  import('@/lib/pdfGenerator').then(({ generateOrderPDF }) => {
                    const data = JSON.parse(storedData);
                    generateOrderPDF(data, orderId);
                  }).catch(console.error);
                } else {
                  alert('Datele comenzii nu au fost găsite local. Te rugăm să verifici email-ul pentru confirmare.');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              Descarcă confirmare (PDF)
            </button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Garanție montaj</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Echipă autorizată RAR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>20 ani experiență</span>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
