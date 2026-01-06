'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Shield, Clock, Star, Users, TrendingUp, Award, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function InstallationHero() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });
  const [liveBookings, setLiveBookings] = useState(7);
  const [showQuiz, setShowQuiz] = useState(false);

  // Countdown timer pentru urgență
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Social proof live (simulare)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBookings(prev => Math.min(prev + 1, 12));
    }, 45000); // +1 booking la fiecare 45s
    return () => clearInterval(interval);
  }, []);

  const trustSignals = [
    { icon: CheckCircle, text: '1000+ instalări', subtext: '20 ani experiență' },
    { icon: Shield, text: 'Autorizare RAR', subtext: 'Echipă certificată' },
    { icon: Clock, text: 'Instalare 1-3 zile', subtext: 'Programare rapidă' },
    { icon: Star, text: 'Rating 4.9/5', subtext: '200+ recenzii' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Social Proof Live + Countdown */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {/* Live Bookings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-green-400/30"
            >
              <div className="relative">
                <Users className="w-4 h-4 text-green-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-bold text-green-100">
                {liveBookings} persoane programate astăzi
              </span>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-orange-400/30"
            >
              <Zap className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-bold text-orange-100">
                Ofertă specială: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </motion.div>
          </div>

          <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-cyan-500/30 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-cyan-400/40"
          >
            <Award className="w-4 h-4 text-cyan-200" />
            <span className="text-sm font-bold text-cyan-100">Instalare Profesională #1 în București</span>
          </motion.div>

          {/* H1 Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              Instalare Aer Condiționat
            </span>
            <br />
            <span className="text-cyan-300">București & Ilfov</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl mb-8 text-blue-100 font-medium max-w-3xl mx-auto"
          >
            ⚡ Montaj profesional în <span className="text-cyan-300 font-bold">1-3 zile</span> | 
            🛡️ Garanție montaj = Garanție aparat | 
            ✓ Echipă autorizată RAR cu <span className="text-cyan-300 font-bold">20 ani experiență</span>
          </motion.p>

          {/* Trust Signals Grid - Animate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {trustSignals.map((signal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-blue-800/80 to-blue-900/80 backdrop-blur-md rounded-xl p-5 flex flex-col items-center gap-2 border border-cyan-400/30 shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <div className="bg-cyan-500/20 p-3 rounded-full mb-1">
                  <signal.icon className="w-6 h-6 text-cyan-300" />
                </div>
                <span className="text-sm font-bold text-center text-white">{signal.text}</span>
                <span className="text-xs text-cyan-200/80 text-center">{signal.subtext}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <a
              href="#calendar"
              className="group relative w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-10 py-5 rounded-xl font-bold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-400/60 hover:scale-105 flex items-center justify-center gap-3"
            >
              <Calendar className="w-5 h-5" />
              <span>Programează ACUM</span>
              <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                -30%
              </span>
            </a>
            <button
              onClick={() => setShowQuiz(!showQuiz)}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-cyan-400/50 text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-cyan-300" />
              <span>Calculator BTU Rapid</span>
            </button>
          </motion.div>

          {/* Preț Evidențiat + Micro-copy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-2xl p-6 border-2 border-orange-400/40 shadow-2xl max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm font-bold text-orange-200">🔥 OFERTĂ LIMITATĂ</span>
              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold">DOAR ASTĂZI</span>
            </div>
            <p className="text-lg font-semibold text-white mb-2">
              Preț instalare de la{' '}
              <span className="text-5xl font-bold text-white drop-shadow-2xl">1000 RON</span>
            </p>
            <p className="text-sm font-medium text-blue-100 mb-3">
              ✓ Kit instalare 3m inclus | ✓ Manoperă profesională | ✓ Garanție montaj
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-blue-200">
              <span>💳 Plată în rate</span>
              <span>•</span>
              <span>🚚 Transport gratuit</span>
              <span>•</span>
              <span>📞 Suport 24/7</span>
            </div>
          </motion.div>

          {/* Quick Quiz (Engagement) */}
          {showQuiz && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 bg-blue-800/60 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30"
            >
              <h3 className="text-xl font-bold text-white mb-4 text-center">⚡ Calculator BTU Rapid</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a href="#recomandari" className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-lg p-4 text-center transition-all hover:scale-105">
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="text-white font-bold mb-1">10-20 m²</div>
                  <div className="text-cyan-200 text-sm">9000 BTU</div>
                </a>
                <a href="#recomandari" className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-lg p-4 text-center transition-all hover:scale-105">
                  <div className="text-3xl mb-2">🏡</div>
                  <div className="text-white font-bold mb-1">20-35 m²</div>
                  <div className="text-cyan-200 text-sm">12000 BTU</div>
                </a>
                <a href="#recomandari" className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-lg p-4 text-center transition-all hover:scale-105">
                  <div className="text-3xl mb-2">🏢</div>
                  <div className="text-white font-bold mb-1">35-50 m²</div>
                  <div className="text-cyan-200 text-sm">18000 BTU</div>
                </a>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
