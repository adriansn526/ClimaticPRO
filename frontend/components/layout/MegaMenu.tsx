'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Building2, Factory, Settings, Flame, Wrench, Shield, Wind, Headphones } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: {
    name: string;
    slug: string;
    products?: string[];
  }[];
}

const categoryIcons: { [key: number]: React.ReactNode } = {
  1: <Home className="w-5 h-5" />,
  2: <Building2 className="w-5 h-5" />,
  3: <Factory className="w-5 h-5" />,
  4: <Settings className="w-5 h-5" />,
  5: <Flame className="w-5 h-5" />,
  6: <Wrench className="w-5 h-5" />,
  7: <Shield className="w-5 h-5" />,
  8: <Wind className="w-5 h-5" />,
  9: <Headphones className="w-5 h-5" />,
};

const categories: Category[] = [
  {
    id: 1,
    name: 'Aer condiționat rezidențial',
    slug: 'aer-conditionat-rezidential',
    subcategories: [
      {
        name: 'Split de perete',
        slug: 'split-de-perete',
        products: ['9.000 BTU', '12.000 BTU', '18.000 BTU', '24.000 BTU'],
      },
      {
        name: 'Caseta',
        slug: 'caseta',
        products: ['18.000 BTU', '24.000 BTU', '36.000 BTU', '48.000 BTU'],
      },
      {
        name: 'Coloana',
        slug: 'coloana',
        products: ['24.000 BTU', '36.000 BTU', '48.000 BTU', '60.000 BTU'],
      },
      {
        name: 'Duct',
        slug: 'duct',
        products: ['18.000 BTU', '24.000 BTU', '36.000 BTU', '48.000 BTU'],
      },
    ],
  },
  {
    id: 2,
    name: 'Aer condiționat multi-split',
    slug: 'aer-conditionat-multi-split',
    subcategories: [
      {
        name: '2 unități interioare',
        slug: '2-unitati',
      },
      {
        name: '3 unități interioare',
        slug: '3-unitati',
      },
      {
        name: '4 unități interioare',
        slug: '4-unitati',
      },
    ],
  },
  {
    id: 3,
    name: 'Aer condiționat comercial',
    slug: 'aer-conditionat-comercial',
    subcategories: [
      {
        name: 'VRF / VRV',
        slug: 'vrf-vrv',
      },
      {
        name: 'Caseta 4 căi',
        slug: 'caseta-4-cai',
      },
      {
        name: 'Duct comercial',
        slug: 'duct-comercial',
      },
    ],
  },
  {
    id: 4,
    name: 'Sisteme VRV / VRF',
    slug: 'sisteme-vrv-vrf',
  },
  {
    id: 5,
    name: 'Încălzire și apă caldă',
    slug: 'incalzire-apa-calda',
    subcategories: [
      {
        name: 'Pompe de căldură',
        slug: 'pompe-de-caldura',
      },
      {
        name: 'Boilere',
        slug: 'boilere',
      },
    ],
  },
  {
    id: 6,
    name: 'Accesorii, materiale și scule',
    slug: 'accesorii-materiale-scule',
  },
  {
    id: 7,
    name: 'Securitate',
    slug: 'securitate',
  },
  {
    id: 8,
    name: 'Ventilație, recuperare căldură',
    slug: 'ventilatie-recuperare',
  },
  {
    id: 9,
    name: 'Servicii',
    slug: 'servicii',
  },
];

const brands = [
  { name: 'DAIKIN', logo: '/brands/daikin.png' },
  { name: 'GREE', logo: '/brands/gree.png' },
  { name: 'BOSCH', logo: '/brands/bosch.png' },
  { name: 'Midea', logo: '/brands/midea.png' },
  { name: 'MITSUBISHI ELECTRIC', logo: '/brands/mitsubishi.png' },
  { name: 'MITSUBISHI HEAVY', logo: '/brands/mitsubishi-heavy.png' },
];

interface MegaMenuProps {
  alwaysOpen?: boolean;
}

export default function MegaMenu({ alwaysOpen = false }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Trigger Button - Dark text on light background */}
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
          {/* Overlay - Only show if not always open */}
          {!alwaysOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Menu Content */}
          <div className={`${
            alwaysOpen 
              ? 'relative w-72 bg-white border border-gray-200 rounded-lg shadow-lg mt-2' 
              : 'fixed left-0 top-[140px] w-full bg-white shadow-2xl z-50 max-h-[calc(100vh-140px)] overflow-y-auto'
          }`}>
            {alwaysOpen ? (
              // Simple vertical list for homepage
              <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Categorii Produse</h3>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/produse/${category.slug}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg mb-1 hover:bg-primary-50 hover:shadow-sm transition-all text-gray-700 hover:text-primary-600"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary-600">{categoryIcons[category.id]}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    {category.subcategories && <ChevronRight className="w-4 h-4" />}
                  </Link>
                ))}
              </div>
            ) : (
              // Full mega menu with subcategories
              <div className="flex h-full">
                {/* Left Sidebar - Vertical Categories (Fixed Width) */}
                <div className="w-72 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex-shrink-0">
                  <div className="p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Categorii Produse</h3>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/produse/${category.slug}`}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg mb-1 hover:bg-white hover:shadow-sm transition-all ${
                          activeCategory === category.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-700'
                        }`}
                        onMouseEnter={() => setActiveCategory(category.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={activeCategory === category.id ? 'text-primary-600' : 'text-gray-500'}>
                            {categoryIcons[category.id]}
                          </span>
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        {category.subcategories && <ChevronRight className="w-4 h-4" />}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right Content - Horizontal Subcategories & Products */}
                <div className="flex-1 p-8 bg-white">
                  {activeCategory && (
                    <>
                      {/* Category Title */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {categories.find((c) => c.id === activeCategory)?.name}
                        </h2>
                        <p className="text-sm text-gray-600">Explorează gama completă de produse din această categorie</p>
                      </div>

                      {/* Subcategories Grid - Horizontal Layout */}
                      <div className="grid grid-cols-5 gap-6 mb-8">
                        {categories
                          .find((c) => c.id === activeCategory)
                          ?.subcategories?.map((sub, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-primary-50 hover:shadow-md transition-all">
                              <Link
                                href={`/produse/${categories.find((c) => c.id === activeCategory)?.slug}/${sub.slug}`}
                                className="font-semibold text-gray-900 hover:text-primary-600 mb-3 block text-base"
                              >
                                {sub.name}
                              </Link>
                              {sub.products && (
                                <ul className="space-y-2">
                                  {sub.products.map((product, idx) => (
                                    <li key={idx}>
                                      <Link
                                        href={`/produse/${categories.find((c) => c.id === activeCategory)?.slug}/${sub.slug}?capacity=${product}`}
                                        className="text-sm text-gray-600 hover:text-primary-600 hover:underline"
                                      >
                                        {product}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Brands Section - Horizontal */}
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Branduri Premium</h3>
                        <div className="grid grid-cols-6 gap-4">
                          {brands.map((brand, index) => (
                            <Link
                              key={index}
                              href={`/produse?brand=${brand.name.toLowerCase()}`}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all"
                            >
                              <div className="h-10 flex items-center justify-center mb-2">
                                <span className="font-bold text-gray-800 hover:text-primary-600 text-sm">
                                  {brand.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>• Split de perete</div>
                                <div>• Caseta</div>
                                <div>• Coloana</div>
                                <div>• Duct</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* View All Link */}
                      <div className="mt-8 text-center">
                        <Link
                          href="/produse"
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg"
                          onClick={() => setIsOpen(false)}
                        >
                          Vezi oferta completa 
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
