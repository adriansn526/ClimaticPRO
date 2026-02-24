'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Truck, Shield, Wrench, Zap, Wifi } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { ProductSpecs } from '@/lib/productUtils';
import { cleanPrice, calculateDiscount } from '@/lib/productUtils';
import ProductInstallationModal from './ProductInstallationModal';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import TBICalculatorModal from '../tbi/TBICalculatorModal';
import AddToCartModal from '../cart/AddToCartModal';

interface ProductInfoProps {
  product: WooCommerceProduct;
  specs: ProductSpecs;
  brand: string | null;
  standardInstallation: WooCommerceProduct | null;
  premiumInstallation: WooCommerceProduct | null;
}

export default function ProductInfo({ product, specs, brand, standardInstallation, premiumInstallation }: ProductInfoProps) {

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInstallationModalOpen, setIsInstallationModalOpen] = useState(false);
  const [isTBIModalOpen, setIsTBIModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const { addItem } = useCart();
  const { isAdmin } = useAuth();

  const [preSelectedInstallation, setPreSelectedInstallation] = useState<WooCommerceProduct | null>(null);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsCartModalOpen(true);
  };

  const handleInstallationSelectFromCart = (service: WooCommerceProduct) => {
    setIsCartModalOpen(false);
    setPreSelectedInstallation(service);
    setIsInstallationModalOpen(true);
  };

  const discountPercentage = calculateDiscount(product.regularPrice, product.salePrice);
  const inStock = product.stockStatus === 'IN_STOCK';


  // Quick Estimate for Teaser (assuming 60 months, ~24% rate approx default)
  // Ensure price is cleaned of thousands separators (e.g. 1,650.00 -> 1650.00) if assuming standard US format with dot decimal
  // OR 1.650,00 -> 1650.00 if RO? 
  // Given cleanPrice output is RON and screenshot showed 1,650.00 RON likely from cleanPrice:
  // We can assume dot is decimal.
  const rawPriceString = product.price ? product.price.replace(/[^0-9.]/g, '') : '0';
  const currentPrice = parseFloat(rawPriceString) || 0;

  // Simple PMT calc for teaser: Price * (1 + 0.24 * 5) / 60 approx? 
  // Better to just show a generic "Start from" based on Price / 60 * 1.5 factor safe margin?
  // Let's rely on TBI Modal for exact. For teaser, we can try a rough 2.5% monthly cost? P * 0.025?
  // 3000 * 0.025 = 75 RON.
  // 60 months: 3000 / 60 = 50. Interest usually doubles it over 5 years? So 50 * 1.5 = 75. 
  // Let's use Price / 45 as a rough "low" estimate to entice properly? Or fetch?
  // Fetching in client component is okay.

  // Let's use a rough estimate logic for SSR safety then modal exact.
  // Estimate: Total / 40 (approx 5 year with interest)
  const estimatedRate = (currentPrice / 40).toFixed(0);

  // Check if product is AC
  // Primary check: Does it have BTU capacity? (Accessories don't)
  const hasBTU = !!specs.btu;

  // Secondary check: Category based (fallback if BTU missing in data)
  const isCategoryAC = product.productCategories?.nodes?.some(c => {
    const slug = c.slug.toLowerCase();
    const name = c.name.toLowerCase();

    const isRelated = slug.includes('aer') || name.includes('aer') || name.includes('condit');

    const isExcluded =
      slug.includes('accesori') || name.includes('accesori') ||
      slug.includes('igieniz') || name.includes('igieniz') ||
      slug.includes('curatar') || name.includes('curatar') ||
      slug.includes('spray') || name.includes('spray') ||
      slug.includes('montaj') || name.includes('montaj') ||
      slug.includes('servici') || name.includes('servici');

    return isRelated && !isExcluded;
  });

  const isAC = hasBTU || isCategoryAC;

  return (
    <div className="space-y-6">
      <TBICalculatorModal
        isOpen={isTBIModalOpen}
        onClose={() => setIsTBIModalOpen(false)}
        price={currentPrice}
        productName={product.name}
      />

      <AddToCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        product={product}
        quantity={quantity}
        relatedServices={[standardInstallation, premiumInstallation].filter(p => p !== null) as WooCommerceProduct[]}
        onSelectInstallation={handleInstallationSelectFromCart}
      />

      {/* ... Brand & Title ... */}
      <div className="text-sm font-semibold text-gray-900 uppercase">
        {brand}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* ... SKU ... */}
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

      {/* Price & TBI Teaser */}
      <div className="flex gap-4 items-stretch">
        <div className="bg-gray-50 rounded-lg p-4 flex-1">
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

          {/* Admin Only: Suppliers */}
          {isAdmin && (
            <div className="mt-3 text-xs bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800">
              <div className="font-bold border-b border-yellow-200 pb-1 mb-1">Admin: Furnizori</div>
              {(() => {
                try {
                  const meta = product.metaData?.find(m => m.key === 'suppliers_json');
                  if (!meta) return <div className="italic text-gray-400">Niciun furnizor setat.</div>;
                  const suppliers: any[] = JSON.parse(meta.value || '[]');
                  return (
                    <div className="space-y-1">
                      {suppliers.map((s, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{s.name}</span>
                          <span className="font-mono">{s.price} {s.currency || 'RON'}</span>
                        </div>
                      ))}
                      <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-yellow-100">
                        Actualizat: {suppliers[0]?.last_updated || '-'}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return <div className="text-red-500">Eroare parsare date furnizor.</div>;
                }
              })()}
            </div>
          )}
        </div>

        {/* TBI Teaser (Only if price > 1000) */}
        {currentPrice >= 1000 && (
          <div className="bg-white border-2 border-orange-100 rounded-lg p-4 flex flex-col justify-center cursor-pointer hover:border-orange-200 transition" onClick={() => setIsTBIModalOpen(true)}>
            <p className="text-gray-500 text-sm">Rate lunare de la</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{estimatedRate}</span>
              <span className="text-sm font-bold text-gray-900">Lei</span>
            </div>
            <p className="text-xs text-blue-600 underline mt-1">vezi detalii</p>
          </div>
        )}
      </div>

      {/* ... rest of component ... */}

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

      {/* Quantity & Actions */}
      <div className="space-y-4">
        {/* Row 1: Quantity + Installation Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Quantity */}
          <div className="flex items-center border border-gray-300 rounded-lg bg-white shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-3 hover:bg-gray-100 transition-colors text-gray-900 font-bold"
              disabled={!inStock}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center border-x border-gray-300 py-3 text-gray-900 font-medium focus:outline-none"
              disabled={!inStock}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-3 hover:bg-gray-100 transition-colors text-gray-900 font-bold"
              disabled={!inStock}
            >
              +
            </button>
          </div>

          {/* Install Button (Only for AC) */}
          {isAC && (
            <button
              onClick={() => setIsInstallationModalOpen(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
              suppressHydrationWarning
            >
              <Wrench className="w-5 h-5 text-gray-600" />
              <span className="whitespace-nowrap">Solicită Instalare</span>
            </button>
          )}
        </div>

        {/* Row 2: Add to Cart (Full Width) */}
        <button
          disabled={!inStock}
          onClick={handleAddToCart}
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

      {/* Trust Badges Removed */}

      <ProductInstallationModal
        isOpen={isInstallationModalOpen}
        onClose={() => {
          setIsInstallationModalOpen(false);
          setPreSelectedInstallation(null);
        }}
        standardInstallation={standardInstallation}
        premiumInstallation={premiumInstallation}
        mainProduct={product}
        preSelectedInstallation={preSelectedInstallation}
      />
    </div>
  );
}
