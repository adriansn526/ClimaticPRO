'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronRight, Home, Building2, Factory, Settings, Flame, Wrench, Shield, Wind, Headphones } from 'lucide-react';
import { WooCommerceCategory, WooCommerceBrand, WooCommerceAttribute } from '@/lib/woocommerce';

interface MobileMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: WooCommerceCategory[];
  brands?: WooCommerceBrand[];
  categoryFilters?: Record<string, { capacities: WooCommerceAttribute[], energyClasses: WooCommerceAttribute[], brands: WooCommerceBrand[] }>;
}

const categoryIcons: Record<string, any> = {
  'aer-conditionat-rezidential': Home,
  'aer-conditionat-multi-split': Building2,
  'aer-conditionat-comercial': Factory,
  'sisteme-vrv-vrf': Settings,
  'incalzire-apa-calda': Flame,
  'accesorii-materiale-scule': Wrench,
  'securitate': Shield,
  'ventilatie-recuperare-caldura': Wind,
  'ventilatie-recuperare': Wind,
  'servicii': Headphones,
};

export default function MobileMegaMenu({ isOpen, onClose, categories = [], brands = [], categoryFilters = {} }: MobileMegaMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Filter out 'Uncategorized'
  const displayCategories = categories.filter(c => c.slug !== 'uncategorized');

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleCategory = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-white transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" onClick={onClose}>
            <img src="/images/logo.png" alt="ClimaticPRO" className="h-8 w-auto" />
          </Link>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Categorii Produse</h3>

            {displayCategories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || Home;
              const isExpanded = expandedCategory === cat.id;
              const filters = categoryFilters[cat.slug] || { capacities: [], energyClasses: [], brands: [] };
              const subcats = cat.children?.nodes || [];
              const hasChildren = subcats.length > 0 || filters.capacities.length > 0 || filters.energyClasses.length > 0 || filters.brands.length > 0;

              return (
                <div key={cat.id} className="border-b border-gray-100 last:border-0 pb-2">
                  <div
                    className="flex items-center justify-between px-2 py-3 cursor-pointer select-none text-gray-800 font-medium hover:bg-gray-50 rounded-lg"
                    onClick={() => hasChildren ? toggleCategory(cat.id) : (onClose(), window.location.href = `/produse?category=${cat.slug}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary-600" />
                      <span>{cat.name}</span>
                    </div>
                    {hasChildren && (
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && hasChildren && (
                    <div className="pl-10 pr-2 pb-4 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
                      <Link
                        href={`/produse?category=${cat.slug}`}
                        className="block text-sm font-bold text-primary-700 mb-2 hover:underline"
                        onClick={onClose}
                      >
                        Vezi toate produsele {cat.name}
                      </Link>

                      {/* Subcategories */}
                      {subcats.length > 0 && (
                        <div className="space-y-2">
                          {subcats.map((sub: any) => (
                            <Link
                              key={sub.id}
                              href={`/produse?category=${sub.slug}`}
                              className="block text-sm text-gray-600 py-1 hover:text-primary-600"
                              onClick={onClose}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Filters */}
                      {filters.capacities.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Capacitate</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {filters.capacities.slice(0, 6).map((cap: any) => (
                              <Link
                                key={cap.id || cap.slug}
                                href={`/produse?category=${cat.slug}&pa_capacitate=${cap.slug}`}
                                className="text-xs px-2 py-1 bg-gray-50 border rounded text-center truncate"
                                onClick={onClose}
                              >
                                {cap.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {filters.energyClasses.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clasa Energetică</h4>
                          <div className="flex flex-wrap gap-2">
                            {filters.energyClasses.map((cl: any) => (
                              <Link
                                key={cl.id || cl.slug}
                                href={`/produse?category=${cat.slug}&pa_clasa_energie=${cl.slug}`}
                                className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded flex items-center gap-1"
                                onClick={onClose}
                              >
                                {cl.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {filters.brands.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top Branduri</h4>
                          <div className="flex flex-wrap gap-2">
                            {filters.brands.slice(0, 6).map((b: any) => (
                              <Link
                                key={b.slug}
                                href={`/produse?category=${cat.slug}&pa_brand=${b.slug}`}
                                className="text-xs px-2 py-1 bg-white border rounded shadow-sm text-gray-700 font-medium"
                                onClick={onClose}
                              >
                                {b.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
