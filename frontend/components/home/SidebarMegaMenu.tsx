'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Circle
} from 'lucide-react';
import { WooCommerceCategory, WooCommerceBrand, WooCommerceAttribute } from '@/lib/woocommerce';

interface SidebarMegaMenuProps {
  categories: WooCommerceCategory[];
  brands: WooCommerceBrand[];
  categoryFilters?: Record<string, { capacities: WooCommerceAttribute[], energyClasses: WooCommerceAttribute[], brands: WooCommerceBrand[] }>;
}

// Map slugs to icons
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

export default function SidebarMegaMenu({ categories, brands, categoryFilters = {} }: SidebarMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter out 'Uncategorized' and ensure we rely on the prop
  const displayCategories = categories.filter(c => c.slug !== 'uncategorized');

  // Helper to find the currently hovered active object (Top Level or Child)
  const activeCategory = displayCategories.find(c => c.id === hoveredCategory) ||
    displayCategories.flatMap(c => Array.isArray(c) ? c : c.children?.nodes || []).find((c: any) => c.id === hoveredCategory);

  return (
    <>
      {/* Meniu Vertical */}
      <div className="w-full flex-1 bg-white flex flex-col min-h-0" suppressHydrationWarning>
        {/* Categories List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {displayCategories.map((category) => {
            // Get Icon or fallback
            const Icon = categoryIcons[category.slug] || Circle;
            const isHovered = hoveredCategory === category.id;

            // Check if it has real children or if filters are available
            const filters = categoryFilters[category.slug] || { capacities: [], energyClasses: [], brands: [] };
            const hasFilters = filters.capacities.length > 0 || filters.energyClasses.length > 0 || filters.brands.length > 0;
            const hasChildren = (category.children?.nodes && category.children.nodes.length > 0) || hasFilters;

            return (
              <div
                key={category.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 transition-all cursor-pointer group ${isHovered ? 'bg-primary-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`w-5 h-5 group-hover:text-primary-600 transition-colors`} />
                  <Link href={`/produse?category=${category.slug}`} className="text-sm font-medium flex-1">
                    {category.name}
                  </Link>
                </div>
                {hasChildren && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mega Menu - Overlay peste banner */}
      {hoveredCategory && activeCategory && (
        <div
          className="absolute left-64 right-0 top-0 bottom-0 bg-white z-40 p-8 overflow-y-auto shadow-2xl border-l border-gray-100"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          {(() => {
            const subcats = activeCategory.children?.nodes || [];

            const filters = categoryFilters[activeCategory.slug] || { capacities: [], energyClasses: [], brands: [] };
            const displayCapacities = filters.capacities || [];
            const displayEnergyClasses = filters.energyClasses || [];
            const rawBrands = filters.brands || [];

            // Enrich brands with images from global list
            const displayBrands = rawBrands.map((b: any) => {
              const fullBrand = brands.find(fb => fb.slug === b.slug);
              return fullBrand ? { ...b, brandImage: fullBrand.brandImage } : b;
            });

            const hasFilters = displayCapacities.length > 0 || displayEnergyClasses.length > 0 || displayBrands.length > 0;

            if (subcats.length === 0 && !hasFilters) return (
              <div className="text-gray-500 italic p-4">Nicio subcategorie disponibilă.</div>
            );

            if (hasFilters) {
              return (
                <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
                  {/* Col 1: Subcategorii */}
                  <div className="col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">{activeCategory.name}</h2>
                    <div className="space-y-3">
                      {subcats.map((sub: any) => (
                        <Link
                          key={sub.id}
                          href={`/produse?category=${sub.slug}`}
                          className="block text-gray-700 hover:text-primary-600 hover:translate-x-1 transition-all"
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
                          href={`/produse?category=${activeCategory.slug}&pa_capacitate=${cap.slug}`}
                          className="block px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-sm transition-colors text-gray-700 font-medium border border-transparent hover:border-primary-100"
                        >
                          {cap.name}
                        </Link>
                      )) : (
                        <p className="text-gray-400 italic text-xs">Nu sunt filtre disponibile.</p>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Clasa Energetica */}
                  <div className="col-span-1 border-l border-gray-100 pl-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Clasa Energetică</h3>
                    <div className="space-y-2">
                      {displayEnergyClasses.length > 0 ? displayEnergyClasses.map((cl) => (
                        <Link
                          key={cl.id || cl.slug}
                          href={`/produse?category=${activeCategory.slug}&pa_clasa_energie=${cl.slug}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-sm transition-colors text-gray-700 font-medium border border-transparent hover:border-green-100"
                        >
                          <span>{cl.name}</span>
                          {cl.name?.includes('A+++') && <Shield className="w-3 h-3 text-green-600" />}
                        </Link>
                      )) : (
                        <p className="text-gray-400 italic text-xs">Nu sunt filtre disponibile.</p>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Branduri */}
                  <div className="col-span-1 border-l border-gray-100 pl-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Top Branduri</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {displayBrands.length > 0 ? displayBrands.map((brand: any) => (
                        <Link
                          key={brand.id || brand.slug}
                          href={`/produse?category=${activeCategory.slug}&pa_brand=${brand.slug}`}
                          className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-primary-500 hover:shadow-sm transition-all bg-white group text-center h-20"
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

            // Fallback for simple categories (like Accesorii)
            return (
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{activeCategory.name}</h2>
                <div className="grid grid-cols-4 gap-4">
                  {subcats.map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/produse?category=${sub.slug}`}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all font-medium text-gray-800"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
