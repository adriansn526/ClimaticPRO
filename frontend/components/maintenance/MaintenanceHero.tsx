'use client';

import { motion } from 'framer-motion';
import { Shield, Clock, Phone, PenTool, Wind } from 'lucide-react';
import Link from 'next/link';
import MaintenanceBookingWizard from './MaintenanceBookingWizard';

export default function MaintenanceHero() {
  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white overflow-hidden pb-20 pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          >
            Servicii de Igienizare și Reparații <span className="text-teal-300">Aer Condiționat</span>
          </motion.h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto opacity-90">
            Respiră aer curat și prelungește durata de viață a aparatului tău. Intervenție rapidă în București și Ilfov.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-6xl mx-auto">
          {/* Left Area: Booking Wizard */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full relative z-20"
          >
            <div className="bg-teal-600 py-3 px-4 text-white text-center font-bold text-lg rounded-t-xl shadow-lg border-b border-teal-700">
              📅 Rezervă Intervenția Acum
            </div>
            {/* The Wizard Component directly placed here */}
            <MaintenanceBookingWizard />
          </motion.div>

          {/* Right Area: Trust and Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Igienizare Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 lg:p-8 hover:bg-white/15 transition-all w-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-500/30 rounded-full flex items-center justify-center shrink-0">
                  <Wind className="w-7 h-7 text-teal-300" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold">Igienizare Profesională</h3>
              </div>
              <p className="text-emerald-100 mb-2">Eliminăm 99% din bacterii și alergeni. Aparatul tău va sufla aer curat și va răci mult mai eficient.</p>
              <ul className="space-y-2 mt-4 text-sm text-teal-100">
                <li className="flex gap-2 items-center"><Shield className="w-4 h-4 text-teal-400" /> Tratament Anti-Bacterian</li>
                <li className="flex gap-2 items-center"><Shield className="w-4 h-4 text-teal-400" /> Curățare Filtre și Vaporizator</li>
                <li className="flex gap-2 items-center"><Shield className="w-4 h-4 text-teal-400" /> Verificare Funcționare</li>
              </ul>
            </div>

            {/* Reparatii Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 lg:p-8 hover:bg-white/15 transition-all w-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-500/30 rounded-full flex items-center justify-center shrink-0">
                  <PenTool className="w-7 h-7 text-blue-300" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold">Diagnoză și Reparații</h3>
              </div>
              <p className="text-emerald-100 mb-4">Nu mai răcește sau curge apă? Găsim problema rapid și o reparăm la fața locului.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 p-3 rounded-lg text-center">
                  <span className="block text-teal-300 font-bold mb-1">Garanție</span>
                  <span className="text-xs text-white">12 luni piese</span>
                </div>
                <div className="bg-white/10 p-3 rounded-lg text-center">
                  <span className="block text-blue-300 font-bold mb-1">Rapiditate</span>
                  <span className="text-xs text-white">1-3 zile max</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB" />
        </svg>
      </div>
    </section>
  );
}
