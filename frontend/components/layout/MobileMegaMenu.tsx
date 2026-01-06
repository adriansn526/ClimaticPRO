'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Building2, 
  Factory, 
  Settings, 
  Flame, 
  Wrench, 
  Shield, 
  Wind, 
  Headphones,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

const staticCategories = [
  { id: 1, name: 'Aer condiționat rezidențial', slug: 'aer-conditionat-rezidential', icon: Home },
  { id: 2, name: 'Aer condiționat multi-split', slug: 'aer-conditionat-multi-split', icon: Building2 },
  { id: 3, name: 'Aer condiționat comercial', slug: 'aer-conditionat-comercial', icon: Factory },
  { id: 4, name: 'Sisteme VRV / VRF', slug: 'sisteme-vrv-vrf', icon: Settings },
  { id: 5, name: 'Încălzire și apă caldă', slug: 'incalzire-apa-calda', icon: Flame },
  { id: 6, name: 'Accesorii, materiale și scule', slug: 'accesorii-materiale-scule', icon: Wrench },
  { id: 7, name: 'Securitate', slug: 'securitate', icon: Shield },
  { id: 8, name: 'Ventilație, recuperare căldură', slug: 'ventilatie-recuperare', icon: Wind },
  { id: 9, name: 'Servicii', slug: 'servicii', icon: Headphones },
];

const subcategories: Record<number, Array<{ name: string; slug: string; products?: string[] }>> = {
  1: [
    { name: 'Split de perete', slug: 'split-de-perete', products: ['9.000 BTU', '12.000 BTU', '18.000 BTU', '24.000 BTU'] },
    { name: 'Caseta', slug: 'caseta', products: ['18.000 BTU', '24.000 BTU', '36.000 BTU', '48.000 BTU'] },
    { name: 'Coloana', slug: 'coloana', products: ['24.000 BTU', '36.000 BTU', '48.000 BTU', '60.000 BTU'] },
    { name: 'Duct', slug: 'duct', products: ['18.000 BTU', '24.000 BTU', '36.000 BTU', '48.000 BTU'] },
  ],
  2: [
    { name: '2 unități interioare', slug: '2-unitati' },
    { name: '3 unități interioare', slug: '3-unitati' },
    { name: '4 unități interioare', slug: '4-unitati' },
  ],
  3: [
    { name: 'VRF / VRV', slug: 'vrf-vrv' },
    { name: 'Caseta 4 căi', slug: 'caseta-4-cai' },
    { name: 'Duct comercial', slug: 'duct-comercial' },
  ],
  5: [
    { name: 'Pompe de căldură', slug: 'pompe-de-caldura' },
    { name: 'Boilere', slug: 'boilere' },
  ],
};

interface MobileMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMegaMenu({ isOpen, onClose }: MobileMegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const handleCategoryClick = (categoryId: number) => {
    if (subcategories[categoryId]) {
      setActiveCategory(categoryId);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    setActiveCategory(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 md:hidden overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              {activeCategory ? (
                <>
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-900"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-semibold">Înapoi</span>
                  </button>
                  <button onClick={onClose} className="p-2 text-gray-900">
                    <X className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <>
                  <NextImage
                    src="/images/logo.png"
                    alt="ClimaticPRO"
                    width={160}
                    height={50}
                    className="h-12 w-auto"
                  />
                  <button onClick={onClose} className="p-2 text-gray-900">
                    <X className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {!activeCategory ? (
                  // Categories List
                  <motion.div
                    key="categories"
                    initial={{ x: 0 }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    {staticCategories.map((category) => {
                      const Icon = category.icon;
                      const hasSubcategories = !!subcategories[category.id];

                      return hasSubcategories ? (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id)}
                          className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-800" />
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      ) : (
                        <Link
                          key={category.id}
                          href={`/produse/${category.slug}`}
                          onClick={onClose}
                          className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-800" />
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                        </Link>
                      );
                    })}

                    {/* Separator */}
                    <div className="h-2 bg-gray-100"></div>

                    {/* Additional Pages */}
                    <Link
                      href="/instalare"
                      onClick={onClose}
                      className="w-full flex items-center px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">Instalare</span>
                    </Link>
                    <Link
                      href="/vanzari-b2b"
                      onClick={onClose}
                      className="w-full flex items-center px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">Vanzari B2B</span>
                    </Link>
                    <Link
                      href="/resurse"
                      onClick={onClose}
                      className="w-full flex items-center px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">Resurse & Ghiduri</span>
                    </Link>
                  </motion.div>
                ) : (
                  // Subcategories List
                  <motion.div
                    key="subcategories"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {staticCategories.find(c => c.id === activeCategory)?.name}
                      </h3>

                      {subcategories[activeCategory]?.map((subcategory, index) => (
                        <div key={index} className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <Link
                            href={`/produse/${staticCategories.find(c => c.id === activeCategory)?.slug}/${subcategory.slug}`}
                            onClick={onClose}
                            className="font-semibold text-gray-900 hover:text-primary-600 mb-2 block"
                          >
                            {subcategory.name}
                          </Link>
                          {subcategory.products && (
                            <ul className="space-y-2 mt-2">
                              {subcategory.products.map((product, idx) => (
                                <li key={idx}>
                                  <Link
                                    href={`/produse/${staticCategories.find(c => c.id === activeCategory)?.slug}/${subcategory.slug}?capacity=${product}`}
                                    onClick={onClose}
                                    className="text-sm text-gray-600 hover:text-primary-600 block"
                                  >
                                    • {product}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
