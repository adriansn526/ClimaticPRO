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

interface FilterSet {
  capacities: WooCommerceAttribute[];
  energyClasses: WooCommerceAttribute[];
}

interface SidebarMegaMenuProps {
  categories: WooCommerceCategory[];
  brands: WooCommerceBrand[];
  rezidentialFilters: FilterSet;
  comercialFilters: FilterSet;
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

// Virtual subcategories for items that rely on attributes instead of child categories
const virtualSubcategories: Record<string, Array<{ name: string; href: string; count?: string }>> = {
  'split-de-perete': [
    { name: '9.000 BTU', href: '/produse?category=split-de-perete&pa_capacitate=9000-btu', count: 'Standard' },
    { name: '12.000 BTU', href: '/produse?category=split-de-perete&pa_capacitate=12000-btu', count: 'Popular' },
    { name: '18.000 BTU', href: '/produse?category=split-de-perete&pa_capacitate=18000-btu', count: 'Living Mare' },
    { name: '24.000 BTU', href: '/produse?category=split-de-perete&pa_capacitate=24000-btu', count: 'Spații Mari' },
  ],
};

export default function SidebarMegaMenu({ categories, brands, rezidentialFilters, comercialFilters }: SidebarMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter out 'Uncategorized' and ensure we rely on the prop
  const displayCategories = categories.filter(c => c.slug !== 'uncategorized');



  // Helper to find the currently hovered active object (Top Level or Child)
  const activeCategory = displayCategories.find(c => c.id === hoveredCategory) ||
    displayCategories.flatMap(c => c.flatMap ? c.flatMap(x => x) : c.children?.nodes || []).find((c: any) => c.id === hoveredCategory);

  return (
    <>
      {/* Meniu Vertical */}
      <div className="w-full h-full bg-white flex flex-col" suppressHydrationWarning>
        {/* Categories List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {displayCategories.map((category) => {
            // Get Icon or fallback
            const Icon = categoryIcons[category.slug] || Circle;
            const isHovered = hoveredCategory === category.id;

            // Check if it has real children or if any of its children have virtual subcategories
            const hasChildren = (category.children?.nodes && category.children.nodes.length > 0) ||
              (category.slug === 'aer-conditionat-rezidential' || category.slug === 'aer-conditionat-comercial');

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

            // Logic specific pentru panou extins vs simplu
            const isRezidential = activeCategory.slug.includes('rezidential');
            const isComercial = activeCategory.slug.includes('comercial');
            const isComplexCategory = isRezidential || isComercial;

            const showBrands = isComplexCategory;
            const filteredBrands = brands.filter(b => b.count && b.count > 0).slice(0, 8);



            // Choose filters
            const currentFilters = isRezidential ? rezidentialFilters : (isComercial ? comercialFilters : { capacities: [], energyClasses: [] });

            console.log('DEBUG_SIDEBAR:', {
              cat: activeCategory.slug,
              isComplex: isComplexCategory,
              filters: currentFilters?.capacities?.length,
              brands: filteredBrands.length
            });

            // Simple sort to avoid errors
            const displayCapacities = currentFilters.capacities || [];
            const displayEnergyClasses = currentFilters.energyClasses || [];


            // Custom simplified logic for columns
            // Col 1: Subcats
            // Col 2: Capacities
            // Col 3: Energy Class
            // Col 4: Top Brands

            if (subcats.length === 0 && !showBrands) return (
              <div className="text-gray-500 italic p-4">Nicio subcategorie disponibilă.</div>
            );

            if (isComplexCategory) {
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
                    </div>
                  </div>

                  {/* Col 2: Capacitate */}
                  <div className="col-span-1 border-l border-gray-100 pl-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Capacitate (BTU)</h3>
                    <div className="space-y-2">
                      {displayCapacities.map((cap) => (
                        <Link
                          key={cap.id}
                          href={`/produse?category=${activeCategory.slug}&pa_capacitate=${cap.slug}`}
                          className="block px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-sm transition-colors text-gray-700 font-medium border border-transparent hover:border-primary-100"
                        >
                          {cap.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Clasa Energetica */}
                  <div className="col-span-1 border-l border-gray-100 pl-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Clasa Energetică</h3>
                    <div className="space-y-2">
                      {displayEnergyClasses.map((cl) => (
                        <Link
                          key={cl.id}
                          href={`/produse?category=${activeCategory.slug}&pa_clasa_energie=${cl.slug}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-sm transition-colors text-gray-700 font-medium border border-transparent hover:border-green-100"
                        >
                          <span>{cl.name}</span>
                          {cl.name.includes('A+++') && <Shield className="w-3 h-3 text-green-600" />}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Branduri */}
                  <div className="col-span-1 border-l border-gray-100 pl-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-6">Top Branduri</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredBrands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/produse?category=${activeCategory.slug}&pa_brand=${brand.slug}`}
                          className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-primary-500 hover:shadow-sm transition-all bg-white group text-center h-20"
                        >
                          {brand.brandImage ? (
                            <img src={brand.brandImage} alt={brand.name} className="h-6 object-contain mb-1 opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <span className="text-gray-800 font-bold text-xs group-hover:text-primary-600">{brand.name}</span>
                          )}
                        </Link>
                      ))}
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
