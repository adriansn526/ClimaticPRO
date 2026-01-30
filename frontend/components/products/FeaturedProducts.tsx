'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { extractBrand } from '@/lib/productUtils';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  products: WooCommerceProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  // Extract unique brands from products
  const brands = ['all', ...Array.from(new Set(
    products.map(p => extractBrand(p)).filter(Boolean)
  ))];

  // Filter products by brand
  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p => {
      const brand = extractBrand(p);
      return brand.toLowerCase() === activeTab.toLowerCase();
    });

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Produse Recomandate
            </h2>
            <p className="text-gray-600 text-lg">
              Cele mai populare sisteme de aer condiționat
            </p>
          </div>
          <Link
            href="/produse"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
          >
            Vezi toate produsele
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Brand Tabs */}
        {brands.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveTab(brand)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === brand
                    ? 'bg-primary-600 text-gray-900 shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                suppressHydrationWarning
              >
                {brand === 'all' ? 'Toate' : brand}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nu există produse disponibile pentru acest brand.
            </p>
          </div>
        )}

        {/* Trust Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">15+</div>
            <div className="text-gray-600">Ani Experiență</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">2000+</div>
            <div className="text-gray-600">Instalări</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">98%</div>
            <div className="text-gray-600">Clienți Mulțumiți</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">24h</div>
            <div className="text-gray-600">Livrare Rapidă</div>
          </div>
        </div>
      </div>
    </section>
  );
}
