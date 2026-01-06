'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, FileText, Settings, Sparkles, Truck, Shield } from 'lucide-react';
import NextImage from 'next/image';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { cleanPrice } from '@/lib/productUtils';

interface StickyProductBarProps {
  product: WooCommerceProduct;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

const sections = [
  { id: 'descriere', label: 'Descriere', Icon: FileText },
  { id: 'specificatii', label: 'Specificații', Icon: Settings },
  { id: 'caracteristici', label: 'Caracteristici', Icon: Sparkles },
  { id: 'livrare', label: 'Livrare', Icon: Truck },
  { id: 'garantie', label: 'Garanție', Icon: Shield },
];

export default function StickyProductBar({ product, activeSection, onSectionClick }: StickyProductBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Detectează când scroll-ul trece de butonul "Adaugă în coș" (aproximativ 600px)
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 600);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const productImage = product.image?.sourceUrl || '/images/product-placeholder.svg';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg"
        >
          <div className="container mx-auto px-4">
            {/* Top Bar: Image + Title + Price + Button */}
            <div className="flex items-center gap-4 py-3 border-b border-gray-100">
              {/* Product Image */}
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                <NextImage
                  src={productImage}
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                />
              </div>

              {/* Product Title */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {product.name}
                </h2>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {cleanPrice(product.price)}
                </p>
              </div>

              {/* Add to Cart Button */}
              <button 
                style={{ background: 'linear-gradient(to right, #0052a3, #003d7a)', color: '#ffffff' }}
                className="flex items-center gap-2 hover:opacity-90 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Adaugă în Coș</span>
                <span className="sm:hidden">Coș</span>
              </button>
            </div>

            {/* Bottom Bar: Navigation Sections */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
              {sections.map((section) => {
                const Icon = section.Icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionClick(section.id)}
                    style={isActive ? { backgroundColor: '#0052a3', color: '#ffffff', borderColor: '#003d7a' } : undefined}
                    className={
                      isActive
                        ? 'flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-all text-xs sm:text-sm font-medium shadow-lg border-2'
                        : 'flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-all text-xs sm:text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
