'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Truck, Shield, Wrench, Zap, Wifi } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { ProductSpecs } from '@/lib/productUtils';
import { cleanPrice, calculateDiscount } from '@/lib/productUtils';

interface ProductInfoProps {
  product: WooCommerceProduct;
  specs: ProductSpecs;
  brand: string;
}

export default function ProductInfo({ product, specs, brand }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercentage = calculateDiscount(product.regularPrice, product.salePrice);
  const inStock = product.stockStatus === 'IN_STOCK';

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="text-sm font-semibold text-gray-900 uppercase">
        {brand}
      </div>

      {/* Product Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* SKU & Stock */}
      <div className="flex items-center gap-4 text-sm">
        {product.sku && (
          <span className="text-gray-600">
            Cod produs: <span className="font-medium">{product.sku}</span>
          </span>
        )}
        <span className={`font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
          {inStock ? '✓ În stoc' : '✗ Stoc epuizat'}
        </span>
      </div>

      {/* Price */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">
            {cleanPrice(product.price)}
          </span>
          {product.onSale && product.regularPrice && (
            <>
              <span className="text-xl text-gray-400 line-through">
                {cleanPrice(product.regularPrice)}
              </span>
              {discountPercentage && (
                <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">TVA inclus</p>
      </div>

      {/* Specs Quick View */}
      <div className="border-t border-b py-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Specificații principale:</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {specs.btu && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Capacitate:</span>
              <span className="font-medium text-gray-900">{specs.btu} BTU</span>
            </div>
          )}
          {specs.energyClass && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Clasa energetică:</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                {specs.energyClass}
              </span>
            </div>
          )}
          {specs.area && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Suprafață:</span>
              <span className="font-medium text-gray-900">{specs.area}</span>
            </div>
          )}
          {specs.inverter && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Inverter</span>
            </div>
          )}
          {specs.wifi && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-2 py-1 rounded">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">WiFi</span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Cantitate:</label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 hover:bg-gray-100 transition-colors text-gray-900 font-bold text-xl"
              disabled={!inStock}
              suppressHydrationWarning
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center border-x border-gray-300 py-2 text-gray-900 font-medium"
              disabled={!inStock}
              suppressHydrationWarning
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 hover:bg-gray-100 transition-colors text-gray-900 font-bold text-xl"
              disabled={!inStock}
              suppressHydrationWarning
            >
              +
            </button>
          </div>
        </div>

        <button
          disabled={!inStock}
          style={inStock ? { background: 'linear-gradient(to right, #0052a3, #003d7a)', color: '#ffffff' } : undefined}
          className="w-full disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90 font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          suppressHydrationWarning
        >
          <ShoppingCart className="w-6 h-6" />
          {inStock ? 'Adaugă în coș' : 'Stoc epuizat'}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="border border-gray-300 hover:border-primary-600 text-gray-700 hover:text-primary-600 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            suppressHydrationWarning
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            Favorite
          </button>
          <button className="border border-gray-300 hover:border-primary-600 text-gray-700 hover:text-primary-600 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2" suppressHydrationWarning>
            <Share2 className="w-5 h-5" />
            Distribuie
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Livrare gratuită</p>
            <p className="text-sm text-gray-600">În București și Ilfov pentru aparate instalate de noi</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Garanție producător</p>
            <p className="text-sm text-gray-600">Conform specificațiilor producătorului</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Instalare profesională</p>
            <p className="text-sm text-gray-600">Standard 950 Lei | Premium 1.200 Lei</p>
          </div>
        </div>
      </div>

      {/* CTA Secondary */}
      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2" suppressHydrationWarning>
        <ShoppingCart className="w-5 h-5" />
        Solicită Instalare
      </button>
    </div>
  );
}
