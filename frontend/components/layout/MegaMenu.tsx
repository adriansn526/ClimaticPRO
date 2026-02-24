'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  Building2,
  Factory,
  Settings,
  Flame,
  Wrench,
  Shield,
  Wind,
  Headphones
} from 'lucide-react';
import { WooCommerceCategory, WooCommerceBrand, WooCommerceAttribute } from '@/lib/woocommerce';

interface MegaMenuProps {
  alwaysOpen?: boolean;
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

export default function MegaMenu({ alwaysOpen = false, categories = [], brands = [], categoryFilters = {} }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<WooCommerceCategory | null>(null);

  // Filter out 'Uncategorized'
  const displayCategories = categories.filter(c => c.slug !== 'uncategorized');

  // Correctly identify the active category object based on hover
  const currentCategory = displayCategories.find(c => c.id === hoveredCategory);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !alwaysOpen && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 font-semibold hover:bg-gray-50 transition-colors rounded-lg shadow-sm border border-gray-200"
        suppressHydrationWarning
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        GAMA DE PRODUSE
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && (
        <>
          {!alwaysOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div className={`${alwaysOpen
            ? 'relative w-72 bg-white border border-gray-200 rounded-lg shadow-lg mt-2'
            : 'fixed left-0 top-[140px] w-full bg-white shadow-2xl z-50 flex h-[600px]'
            }`}>
            {/* Left Sidebar - Categories */}
            <div className="w-72 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Categorii Produse</h3>
                {displayCategories.map((category) => {
                  const Icon = categoryIcons[category.slug] || Home;
                  const isHovered = hoveredCategory === category.id;
                  const hasChildren = (category.children?.nodes && category.children.nodes.length > 0) ||
                    (categoryFilters?.[category.slug]?.capacities?.length > 0);

                  return (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg mb-1 cursor-pointer transition-all ${isHovered ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-700 hover:bg-white/50'
                        }`}
                      onMouseEnter={() => setHoveredCategory(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isHovered ? 'text-primary-600' : 'text-gray-500'}`} />
                        <Link href={`/produse?category=${category.slug}`} className="text-sm font-medium flex-1">
                          {category.name}
                        </Link>
                      </div>
                      {hasChildren && <ChevronRight className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Content - Details */}
            <div className="flex-1 p-8 bg-white overflow-y-auto" onMouseLeave={() => setHoveredCategory(null)}>
              {currentCategory ? (
                (() => {
                  const activeCat = currentCategory;
                  const subcats = activeCat.children?.nodes || [];

                  const filters = categoryFilters[activeCat.slug] || { capacities: [], energyClasses: [], brands: [] };
                  const displayCapacities = filters.capacities || [];
                  const displayEnergyClasses = filters.energyClasses || [];
                  const rawBrands = filters.brands || [];

                  // Enrich brands with images from global list
                  const displayBrands = rawBrands.map((b: any) => {
                    const fullBrand = brands.find(fb => fb.slug === b.slug);
                    return fullBrand ? { ...b, brandImage: fullBrand.brandImage } : b;
                  });

                  const hasFilters = displayCapacities.length > 0 || displayEnergyClasses.length > 0 || displayBrands.length > 0;

                  if (hasFilters) {
                    return (
                      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
                        {/* Col 1: Subcategories */}
                        <div className="col-span-1">
                          <Link href={`/produse?category=${activeCat.slug}`} className="text-xl font-bold text-gray-900 mb-6 border-b pb-2 block hover:text-primary-600">
                            {activeCat.name}
                          </Link>
                          <div className="space-y-3">
                            {subcats.map((sub: any) => (
                              <Link
                                key={sub.id}
                                href={`/produse?category=${sub.slug}`}
                                className="block text-gray-700 hover:text-primary-600 hover:translate-x-1 transition-all"
                                onClick={() => setIsOpen(false)}
                              >
                                {sub.name}
                                {sub.count > 0 && <span className="text-xs text-gray-400 ml-2">({sub.count})</span>}
                              </Link>
                            ))}
                            {subcats.length === 0 && (
                              <p className="text-gray-400 italic text-sm">Nicio subcategorie.</p>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Capacitate */}
                        <div className="col-span-1 border-l border-gray-100 pl-6">
                          <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Capacitate (BTU)</h3>
                          <div className="space-y-2">
                            {displayCapacities.length > 0 ? displayCapacities.map((cap) => (
                              <Link
                                key={cap.id || cap.slug}
                                href={`/produse?category=${activeCat.slug}&pa_capacitate=${cap.slug}`}
                                className="block px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-sm transition-colors text-gray-700 font-medium"
                                onClick={() => setIsOpen(false)}
                              >
                                {cap.name}
                              </Link>
                            )) : (
                              <p className="text-gray-400 italic text-xs">Nu sunt filtre disponibile.</p>
                            )}
                          </div>
                        </div>

                        {/* Col 3: Energy */}
                        <div className="col-span-1 border-l border-gray-100 pl-6">
                          <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Clasa Energetică</h3>
                          <div className="space-y-2">
                            {displayEnergyClasses.length > 0 ? displayEnergyClasses.map((cl) => (
                              <Link
                                key={cl.id || cl.slug}
                                href={`/produse?category=${activeCat.slug}&pa_clasa_energie=${cl.slug}`}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-sm transition-colors text-gray-700 font-medium"
                                onClick={() => setIsOpen(false)}
                              >
                                <span>{cl.name}</span>
                                {cl.name.includes('A+++') && <Shield className="w-3 h-3 text-green-600" />}
                              </Link>
                            )) : (
                              <p className="text-gray-400 italic text-xs">Nu sunt filtre disponibile.</p>
                            )}
                          </div>
                        </div>

                        {/* Col 4: Top Brands */}
                        <div className="col-span-1 border-l border-gray-100 pl-6">
                          <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Top Branduri</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {displayBrands.length > 0 ? displayBrands.map((brand: any) => (
                              <Link
                                key={brand.id || brand.slug}
                                href={`/produse?category=${activeCat.slug}&pa_brand=${brand.slug}`}
                                className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-primary-500 hover:shadow-sm transition-all bg-white group text-center h-20"
                                onClick={() => setIsOpen(false)}
                              >
                                {brand.brandImage ? (
                                  <img src={brand.brandImage} alt={brand.name} className="h-6 object-contain mb-1 opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <span className="text-gray-800 font-bold text-xs group-hover:text-primary-600">{brand.name}</span>
                                )}
                              </Link>
                            )) : (
                              <p className="text-gray-400 italic text-xs col-span-2">Nu sunt branduri.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Simple Category Fallback (if no filters)
                  return (
                    <div className="max-w-6xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">{activeCat.name}</h2>
                      <div className="grid grid-cols-4 gap-4">
                        {subcats.map((sub: any) => (
                          <Link
                            key={sub.id}
                            href={`/produse?category=${sub.slug}`}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all font-medium text-gray-800"
                            onClick={() => setIsOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );

                })()
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 italic">
                  Selectează o categorie din stânga pentru a vedea detaliile.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
