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
import { WooCommerceCategory } from '@/lib/woocommerce';

interface SidebarMegaMenuProps {
  categories: WooCommerceCategory[];
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
  'ventilatie-recuperare-caldura': Wind, // Updated slug guess
  'ventilatie-recuperare': Wind,
  'servicii': Headphones,
};

export default function SidebarMegaMenu({ categories }: SidebarMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter out 'Uncategorized' and ensure we rely on the prop
  const displayCategories = categories.filter(c => c.slug !== 'uncategorized');

  // Helper to find the currently hovered category object
  const activeCategory = displayCategories.find(c => c.id === hoveredCategory);

  return (
    <>
      {/* Meniu Vertical */}
      <div className="w-full h-full bg-white flex flex-col">
        {/* Categories List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {displayCategories.map((category) => {
            // Get Icon or fallback
            const Icon = categoryIcons[category.slug] || Circle;
            const isHovered = hoveredCategory === category.id;
            const hasChildren = category.children?.nodes && category.children.nodes.length > 0;

            return (
              <div
                key={category.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 transition-all cursor-pointer ${isHovered ? 'bg-primary-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={(e) => {
                  // Dacă are subcategorii, prevenim navigarea la click pe părinte (UX choice)
                  // Sau permitem navigarea dar menținem meniul deschis
                  if (hasChildren) {
                    // e.preventDefault(); // Optional: uncomment if parent links shouldn't work
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`w-5 h-5 ${isHovered ? 'text-gray-900' : 'text-gray-500'}`} />
                  <Link href={`/produse/${category.slug}`} className="text-sm font-medium flex-1">
                    {category.name}
                  </Link>
                </div>
                {hasChildren && <ChevronRight className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mega Menu - Overlay peste banner */}
      {hoveredCategory && activeCategory && activeCategory.children?.nodes && activeCategory.children.nodes.length > 0 && (
        <div
          className="absolute left-64 right-0 top-0 bottom-0 bg-white z-40 p-8 overflow-y-auto shadow-2xl"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeCategory.name}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeCategory.children.nodes.map((subcategory) => (
                <div key={subcategory.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all">
                  <Link
                    href={`/produse/${subcategory.slug}`} // Assuming flat structure for now or query based
                    className="font-semibold text-lg text-gray-900 hover:text-primary-600 mb-2 block"
                  >
                    {subcategory.name}
                  </Link>
                  <p className="text-xs text-gray-500">{subcategory.count} produse</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
