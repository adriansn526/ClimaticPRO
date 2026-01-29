'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Package, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  btu: number;
  energyClass: string;
  price: number;
  priceWithInstallation: number;
  features: string[];
  badge?: 'Bestseller' | 'Eficient' | 'Premium';
}

export default function ProductRecommendations() {
  const [hasOwnDevice, setHasOwnDevice] = useState(false);
  const [roomArea, setRoomArea] = useState<number>(0);
  const [recommendedBTU, setRecommendedBTU] = useState<number>(0);

  // Calculator BTU
  const calculateBTU = (area: number) => {
    const baseBTU = area * 400;
    const standards = [9000, 12000, 18000, 24000, 30000];
    const recommended = standards.find(s => s >= baseBTU) || 30000;
    setRecommendedBTU(recommended);
  };

  // Produse recomandate (în producție: fetch din WooCommerce)
  const products: RecommendedProduct[] = [
    {
      id: '1',
      name: 'Aer Condiționat Midea Mission Pro 12000 BTU',
      slug: 'midea-mission-pro-12000-btu',
      image: '/products/midea-12000.jpg',
      btu: 12000,
      energyClass: 'A++',
      price: 1929,
      priceWithInstallation: 2899,
      features: ['Inverter', 'WiFi Smart', 'Auto-curățare'],
      badge: 'Bestseller',
    },
    {
      id: '2',
      name: 'Aer Condiționat Gree Fairy 9000 BTU',
      slug: 'gree-fairy-9000-btu',
      image: '/products/gree-9000.jpg',
      btu: 9000,
      energyClass: 'A+++',
      price: 1599,
      priceWithInstallation: 2569,
      features: ['Inverter', 'Silențios', 'Eco Mode'],
      badge: 'Eficient',
    },
    {
      id: '3',
      name: 'Aer Condiționat Daikin Sensira 18000 BTU',
      slug: 'daikin-sensira-18000-btu',
      image: '/products/daikin-18000.jpg',
      btu: 18000,
      energyClass: 'A++',
      price: 2899,
      priceWithInstallation: 3869,
      features: ['Inverter', 'Flash Cooling', 'WiFi'],
      badge: 'Premium',
    },
  ];

  const filteredProducts = recommendedBTU > 0
    ? products.filter(p => p.btu === recommendedBTU)
    : products;

  return (
    <section id="recomandari" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Recomandarea Noastră
            </h2>
            <p className="text-lg text-gray-600">
              Alege aparatul potrivit sau instalăm aparatul tău
            </p>
          </div>

          {/* Toggle: Am aparat / Vreau să cumpăr */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <button
              onClick={() => setHasOwnDevice(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${hasOwnDevice
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <Package className={`w-6 h-6 mx-auto mb-2 ${hasOwnDevice ? 'text-primary-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-gray-900">Am deja aparat</p>
              <p className="text-sm text-gray-600 mt-1">Vreau doar instalare</p>
            </button>

            <button
              onClick={() => setHasOwnDevice(false)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${!hasOwnDevice
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <ShoppingCart className={`w-6 h-6 mx-auto mb-2 ${!hasOwnDevice ? 'text-primary-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-gray-900">Vreau să cumpăr</p>
              <p className="text-sm text-gray-600 mt-1">Aparat + instalare</p>
            </button>
          </div>

          {/* Conținut condiționat */}
          {hasOwnDevice ? (
            /* Am deja aparat */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto bg-gray-50 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detalii Aparat Existent</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip aparat
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option>Split wall (perete)</option>
                    <option>Caseta (tavan)</option>
                    <option>Portabil</option>
                    <option>Altul</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BTU (dacă știi)
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 12000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Preț instalare:</strong> 950 RON (include kit 3m + manoperă + garanție)
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Vreau să cumpăr */
            <div>
              {/* Calculator BTU */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-gray-900">Calculator BTU Recomandat</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suprafața camerei (m²)
                    </label>
                    <input
                      type="number"
                      value={roomArea || ''}
                      onChange={(e) => {
                        const area = parseInt(e.target.value) || 0;
                        setRoomArea(area);
                        if (area > 0) calculateBTU(area);
                      }}
                      placeholder="ex: 25"
                      className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                    />
                  </div>
                  {recommendedBTU > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-lg p-4 border-2 border-primary-600"
                    >
                      <p className="text-sm text-gray-700 font-semibold mb-1">BTU recomandat pentru {roomArea}m²:</p>
                      <p className="text-3xl font-bold text-primary-600 drop-shadow-sm">{recommendedBTU.toLocaleString()} BTU</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Grid Produse */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.badge === 'Bestseller' ? 'bg-yellow-400 text-yellow-900' :
                            product.badge === 'Eficient' ? 'bg-green-400 text-green-900' :
                              'bg-purple-400 text-purple-900'
                          }`}>
                          {product.badge}
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-primary-600">{product.btu} BTU</span>
                        <span className="text-sm px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">
                          {product.energyClass}
                        </span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-1 mb-4">
                        {product.features.map((feature, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                            <span className="w-1 h-1 bg-primary-600 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Pricing */}
                      <div className="border-t pt-4">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-sm text-gray-600 line-through font-medium">{product.price} RON</span>
                          <span className="text-xs text-green-700 font-bold">doar aparat</span>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs text-gray-700 mb-1 font-semibold">Pachet Aparat + Instalare:</p>
                          <p className="text-2xl font-bold text-primary-600 drop-shadow-sm">
                            {product.priceWithInstallation.toLocaleString()} RON
                          </p>
                          <p className="text-xs text-green-700 font-bold">
                            Economie {(product.price + 950 - product.priceWithInstallation)} RON
                          </p>
                        </div>
                        <Link
                          href={`/produs/${product.slug}`}
                          className="block w-full bg-primary-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                        >
                          Selectează + Programează
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
