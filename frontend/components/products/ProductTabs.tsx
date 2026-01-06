'use client';

import { useState } from 'react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { ProductSpecs } from '@/lib/productUtils';

interface ProductTabsProps {
  product: WooCommerceProduct;
  specs: ProductSpecs;
}

export default function ProductTabs({ product, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const tabs = [
    { id: 'description' as const, label: 'Descriere' },
    { id: 'specifications' as const, label: 'Specificații' },
    { id: 'reviews' as const, label: 'Review-uri' },
  ];

  // Clean HTML description
  const cleanDescription = product.description?.replace(/<[^>]*>/g, '') || 'Descriere indisponibilă.';

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Descriere Generală
            </h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p>{cleanDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Specificații Tehnice
            </h3>

            {/* Caracteristici Generale */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                Caracteristici Generale
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specs.btu && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Capacitate</span>
                    <span className="font-medium text-gray-900">{specs.btu} BTU</span>
                  </div>
                )}
                {specs.energyClass && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Clasa energetică</span>
                    <span className="font-medium text-gray-900">{specs.energyClass}</span>
                  </div>
                )}
                {specs.area && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Suprafață recomandată</span>
                    <span className="font-medium text-gray-900">{specs.area}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tip</span>
                  <span className="font-medium text-gray-900">{specs.inverter ? 'Inverter' : 'On/Off'}</span>
                </div>
              </div>
            </div>

            {/* Funcții */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                Funcții
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">WiFi</span>
                  <span className="font-medium text-gray-900">{specs.wifi ? 'Da' : 'Nu'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Inverter</span>
                  <span className="font-medium text-gray-900">{specs.inverter ? 'Da' : 'Nu'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Mod Răcire</span>
                  <span className="font-medium text-gray-900">Da</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Mod Încălzire</span>
                  <span className="font-medium text-gray-900">Da</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Dezumidificare</span>
                  <span className="font-medium text-gray-900">Da</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Auto-curățare</span>
                  <span className="font-medium text-gray-900">Da</span>
                </div>
              </div>
            </div>

            {/* Custom Attributes from WooCommerce */}
            {product.attributes?.nodes && product.attributes.nodes.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Alte Specificații
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.attributes.nodes.map((attr, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{attr.name}</span>
                      <span className="font-medium text-gray-900">{attr.options.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Review-uri
            </h3>
            <p className="text-gray-600 mb-6">
              Fii primul care scrie un review pentru acest produs!
            </p>
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Scrie un review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
