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
  ChevronRight
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  children?: {
    nodes: Category[];
  };
}

interface SidebarMegaMenuProps {
  categories: Category[];
}

// Categorii statice pentru meniu
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

// Subcategorii pentru fiecare categorie
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

export default function SidebarMegaMenu({ categories }: SidebarMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  return (
    <>
      {/* Meniu Vertical */}
      <div className="w-full h-full bg-white flex flex-col">
        {/* Categories List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {staticCategories.map((category) => {
            const Icon = category.icon;
            const isHovered = hoveredCategory === category.id;
            
            return (
              <div
                key={category.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 transition-all cursor-pointer ${
                  isHovered ? 'bg-primary-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={(e) => {
                  // Dacă are subcategorii, prevenim navigarea
                  if (subcategories[category.id]) {
                    e.preventDefault();
                    setHoveredCategory(category.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`w-5 h-5 ${isHovered ? 'text-gray-900' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                {subcategories[category.id] && <ChevronRight className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mega Menu - Overlay peste banner (nu peste meniul vertical) */}
      {hoveredCategory && subcategories[hoveredCategory] && (
        <div 
          className="absolute left-64 right-0 top-0 bottom-0 bg-white z-40 p-8 overflow-y-auto shadow-2xl"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {staticCategories.find(c => c.id === hoveredCategory)?.name}
            </h2>
            
            <div className="grid grid-cols-4 gap-6">
              {subcategories[hoveredCategory].map((subcategory, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all">
                  <Link
                    href={`/produse/${staticCategories.find(c => c.id === hoveredCategory)?.slug}/${subcategory.slug}`}
                    className="font-semibold text-lg text-gray-900 hover:text-primary-600 mb-3 block"
                  >
                    {subcategory.name}
                  </Link>
                  {subcategory.products && (
                    <ul className="space-y-2 mt-3">
                      {subcategory.products.map((product, idx) => (
                        <li key={idx}>
                          <Link
                            href={`/produse/${staticCategories.find(c => c.id === hoveredCategory)?.slug}/${subcategory.slug}?capacity=${product}`}
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
          </div>
        </div>
      )}
    </>
  );
}
