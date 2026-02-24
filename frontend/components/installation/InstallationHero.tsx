'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Shield, Clock, Star, Users, TrendingUp, Award, Zap, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import BookingWizard from './BookingWizard';
import StickyInstallationCTA from './StickyInstallationCTA';

export default function InstallationHero() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });
  const [liveBookings, setLiveBookings] = useState(7);
  const [heroProduct, setHeroProduct] = useState<any>(null);
  const [selectedPromoProduct, setSelectedPromoProduct] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);

  // Fetch Hero Product
  useEffect(() => {
    const fetchHeroProduct = async () => {
      try {
        const response = await fetch('/api/products/installation');
        const data = await response.json();
        if (data.success && data.products && data.products.length > 0) {
          // Select the first product as Hero Product, preferably 12000 BTU
          const product = data.products.find((p: any) => p.btu === 12000) || data.products[0];
          setHeroProduct(product);
        }
      } catch (error) {
        console.error('Error fetching hero product:', error);
      }
    };
    fetchHeroProduct();
  }, []);

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

  const handleAddToPackage = () => {
    if (heroProduct) {
      setSelectedPromoProduct(heroProduct);
      setSelectedQuantity(quantity);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000); // Hide after 5 sec
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden pb-20">
      {/* Toast Notification */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: showToast ? 1 : 0, y: showToast ? 0 : -50 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/20"
      >
        <div className="bg-white/20 p-1 rounded-full"><CheckCircle className="w-5 h-5" /></div>
        <div>
          <p className="font-bold">Produs adăugat în pachet!</p>
          <p className="text-xs opacity-90">Te rugăm să selectezi data din calendar.</p>
        </div>
      </motion.div>

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

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* Header Title Centered */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
          >
            Instalare Aer Condiționat <span className="text-cyan-300">București & Ilfov</span>
          </motion.h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto opacity-90">
            Programare Rapidă Online • Echipă Autorizată • Garanție Montaj
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Interactive Booking Wizard */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-xl"
          >
            <div className="bg-cyan-600 py-2 px-4 text-white text-center font-bold text-base">
              📅 Programează Instalarea
            </div>
            <div className="p-0">
              <BookingWizard compact={true} preSelectedProduct={selectedPromoProduct} preSelectedQuantity={selectedQuantity} />
            </div>
          </motion.div>

          {/* Right Column: Dynamic Hero Product Promotion */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                OFERTĂ EXCLUSIVĂ
              </div>

              {heroProduct ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                    {/* Dynamic Image */}
                    <div className="relative bg-white/20 rounded-xl aspect-[4/3] flex items-center justify-center border border-white/10 overflow-hidden">
                      {heroProduct.image ? (
                        <img src={heroProduct.image} alt={heroProduct.name} className="object-contain w-full h-full p-2" />
                      ) : (
                        <Zap className="w-16 h-16 text-cyan-300" />
                      )}
                      <span className="absolute bottom-2 left-2 text-xs font-mono text-cyan-200 backdrop-blur-md bg-black/30 px-2 py-0.5 rounded">
                        {heroProduct.brand || 'Midea Fresh'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{heroProduct.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-bold rounded border border-green-500/30">
                        {heroProduct.energyClass}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded border border-blue-500/30">
                        {heroProduct.btu} BTU
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded border border-purple-500/30">
                        WiFi
                      </span>
                    </div>

                    <ul className="text-sm text-blue-100 space-y-1 mb-4">
                      {heroProduct.features?.slice(0, 3).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>instalare inclusă</span>
                      </li>
                    </ul>

                    <div className="flex items-end gap-3 mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-cyan-300">
                          {(heroProduct.priceWithInstallation * quantity).toLocaleString()} Lei
                        </span>
                        {quantity > 1 && <span className="text-xs text-blue-200">Total pentru {quantity} unități</span>}
                      </div>
                      {heroProduct.price && (
                        <span className="text-xs text-gray-400 line-through mb-1">
                          {((heroProduct.priceWithInstallation + 300) * quantity).toLocaleString()} Lei
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/20">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition"
                        >-</button>
                        <span className="w-8 text-center font-bold text-white">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition"
                        >+</button>
                      </div>
                      <button
                        onClick={handleAddToPackage}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" /> Adaugă la pachet
                      </button>
                    </div>

                    {/* Marketing Text Added Here */}
                    <div className="mt-3 text-[11px] leading-tight text-blue-200 text-center font-medium opacity-90">
                      Venim cu aerul și îl montam în aceeași zi cu livrarea! 🚀
                    </div>
                  </div>
                </div>
              ) : (
                // Loading Skeleton
                <div className="animate-pulse flex gap-4">
                  <div className="w-1/2 h-40 bg-white/10 rounded-xl"></div>
                  <div className="w-1/2 space-y-3">
                    <div className="h-6 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-20 bg-white/10 rounded w-full"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Trust Signals below promo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-full"><Clock className="w-5 h-5 text-cyan-300" /></div>
                <div>
                  <div className="font-bold text-white text-sm">Rapid</div>
                  <div className="text-xs text-blue-200">1-3 Zile</div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-full"><Shield className="w-5 h-5 text-cyan-300" /></div>
                <div>
                  <div className="font-bold text-white text-sm">Garanție</div>
                  <div className="text-xs text-blue-200">3 Ani</div>
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

      <StickyInstallationCTA />
    </section>
  );
}
