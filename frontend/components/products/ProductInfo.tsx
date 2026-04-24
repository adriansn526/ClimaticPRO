'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Share2, Truck, Shield, Wrench, Zap, Wifi } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { ProductSpecs } from '@/lib/productUtils';
import { cleanPrice, calculateDiscount } from '@/lib/productUtils';
import ProductInstallationModal from './ProductInstallationModal';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import TBICalculatorModal, { calculateTBIRate } from '../tbi/TBICalculatorModal';
import AddToCartModal from '../cart/AddToCartModal';
import { usePostHog } from 'posthog-js/react';

interface ProductInfoProps {
  product: WooCommerceProduct;
  specs: ProductSpecs;
  brand: string | null;
  standardInstallation: WooCommerceProduct | null;
  premiumInstallation: WooCommerceProduct | null;
  b2bSuppliers?: any[];
  isMandatoryInstall?: boolean;
}

export default function ProductInfo({ product, specs, brand, standardInstallation, premiumInstallation, b2bSuppliers = [], isMandatoryInstall = false }: ProductInfoProps) {

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    if (product?.id) {
      posthog?.capture('product_viewed', {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        brand: brand || 'N/A',
        price: product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : 0,
        currency: 'RON'
      });
    }
  }, [product?.id, posthog]);
  const [isInstallationModalOpen, setIsInstallationModalOpen] = useState(false);
  const [isTBIModalOpen, setIsTBIModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [tbiParams, setTbiParams] = useState<any>(null);
  const { addItem } = useCart();
  const { isAdmin } = useAuth();

  const [preSelectedInstallation, setPreSelectedInstallation] = useState<WooCommerceProduct | null>(null);

  const handleAddToCart = () => {
    if (isMandatoryInstall) {
        setIsInstallationModalOpen(true);
        posthog.capture('installation_forced_flow_started', {
            product_id: product.id,
            quantity
        });
    } else {
        addItem(product, quantity);
        setIsCartModalOpen(true);
        posthog.capture('product_added_to_cart', {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          brand,
          price: currentPrice,
          quantity,
          currency: 'RON',
        });
    }
  };

  const handleInstallationSelectFromCart = (service: WooCommerceProduct) => {
    setIsCartModalOpen(false);
    setPreSelectedInstallation(service);
    setIsInstallationModalOpen(true);
  };

  const discountPercentage = calculateDiscount(product.regularPrice, product.salePrice);
  const inStock = product.stockStatus === 'IN_STOCK';


  const rawPriceString = product.price ? product.price.replace(/[^0-9.]/g, '') : '0';
  const currentPrice = parseFloat(rawPriceString) || 0;

  // Fetch TBI params for real rate calculation on product teaser
  useEffect(() => {
    if (currentPrice >= 1000 && !tbiParams) {
      fetch('/api/tbi/params')
        .then(res => res.json())
        .then(data => setTbiParams(data))
        .catch(() => {});
    }
  }, [currentPrice, tbiParams]);

  // Calculate real TBI monthly rate using exact PHP formula
  const tbiResult = tbiParams ? calculateTBIRate(tbiParams, currentPrice) : null;
  const estimatedRate = tbiResult ? tbiResult.monthlyRate.toFixed(0) : (currentPrice / 40).toFixed(0);
  const estimatedMonths = tbiResult?.months ?? null;

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

  // Strict check: we only show installation if the product definitively has a cooling capacity (BTU)
  const isAC = hasBTU;

  // The isMandatoryInstall is now passed as a direct Prop from the B2B prisma side

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

      <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
        {product.name}
      </h1>

      {/* ... SKU ... */}
      <div className="flex items-center gap-4 text-sm font-medium">
        {product.sku && (
          <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            Cod: <span className="text-gray-800">{product.sku}</span>
          </span>
        )}
        <span className={`px-2 py-1 rounded-md bg-opacity-10 ${inStock ? 'text-green-700 bg-green-500' : 'text-red-700 bg-red-500'}`}>
          {inStock ? '✓ În stoc' : '✗ Stoc epuizat'}
        </span>
      </div>

      {/* Price & TBI Teaser */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 flex-1 shadow-sm border border-gray-100">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              {cleanPrice(product.price)}
            </span>
            {product.onSale && product.regularPrice && (
              <>
                <span className="text-xl text-gray-400 line-through font-medium">
                  {cleanPrice(product.regularPrice)}
                </span>
                {discountPercentage && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    -{discountPercentage}%
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 font-medium">TVA inclus</p>
          
          {isMandatoryInstall && (
             <div className="mt-5 bg-orange-50/80 border border-orange-200/60 rounded-xl p-4 text-sm flex items-start gap-3 shadow-sm">
                 <div className="bg-orange-100 p-2 rounded-lg shrink-0">
                    <Wrench className="w-5 h-5 text-orange-600" />
                 </div>
                 <div>
                     <p className="font-bold text-orange-800 text-base">Preț exclusiv cu instalare</p>
                     <p className="text-orange-700/80 mt-1 leading-snug">Pentru a beneficia de acest preț promoțional, achiziția se face împreună cu pachetul de instalare ClimaticPRO.</p>
                 </div>
             </div>
          )}

          {/* Admin Only: Suppliers */}
          {isAdmin && (
            <div className="mt-4 text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-yellow-200 opacity-20 -mr-4 -mt-4 rounded-full"></div>
              <div className="font-bold border-b border-yellow-200 pb-1.5 mb-2 flex items-center justify-between">
                  <span>Admin: Furnizori B2B</span>
                  <span className="bg-yellow-200 text-yellow-900 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Internal</span>
              </div>
              {(() => {
                if (!b2bSuppliers || b2bSuppliers.length === 0) {
                     return <div className="italic text-gray-400">Niciun furnizor setat în B2B.</div>;
                }
                return (
                    <div className="space-y-1.5 relative z-10">
                      {b2bSuppliers.map((s, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/50 px-2 py-1 rounded">
                          <span className="font-medium">{s.name}</span>
                          <span className="font-mono text-green-700 font-bold">{s.price} {s.currency || 'RON'}</span>
                        </div>
                      ))}
                      <div className="text-[9px] text-gray-500 mt-2 pt-2 border-t border-yellow-200/50">
                        Date sincronizate (ultima verif. {new Date(Math.max(...b2bSuppliers.map(s => new Date(s.last_updated || Date.now()).getTime()))).toLocaleDateString('ro-RO')})
                      </div>
                    </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* TBI Teaser (Only if price > 1000) */}
        {currentPrice >= 1000 && (
          <div 
             className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border border-orange-200 sm:w-1/3 rounded-2xl p-5 flex sm:flex-col justify-between sm:justify-center items-center sm:items-start cursor-pointer hover:border-orange-400 hover:shadow-lg transition-all duration-300 shadow-sm group" 
             onClick={() => {
                setIsTBIModalOpen(true);
                posthog.capture('tbi_calculator_opened', {
                  product_id: product.id,
                  product_name: product.name,
                  brand,
                  price: currentPrice,
                });
             }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100 rounded-full opacity-40 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
            
            <div className="relative z-10">
                <p className="text-orange-600 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-0.5">Cumpără în rate</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">{estimatedRate}</span>
                  <span className="text-sm font-bold text-gray-500">Lei/lună</span>
                </div>
                {estimatedMonths && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{estimatedMonths} rate</p>
                )}
            </div>

            <div className="relative z-10 bg-white sm:bg-transparent mt-0 sm:mt-4 px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg shadow-sm border border-gray-100 sm:shadow-none sm:border-none flex items-center text-sm font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                <span className="hidden sm:inline">Simulare credit</span>
                <span className="sm:hidden">Aplică acum</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 sm:group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm">
        <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
            <p className="text-blue-900 leading-snug font-medium">
              Transport Gratuit în București și Ilfov
            </p>
            <p className="text-blue-800/80 leading-snug">
              Valabil exclusiv pentru aparatele care beneficiază de montaj realizat de echipele ClimaticPRO. Pentru restul județelor sau comenzilor fără montaj, se aplică o taxă de transport de <strong className="text-blue-900">120 Lei / aparat</strong>.
            </p>
        </div>
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

          {/* Install Button (Only for AC that is not forced to install) */}
          {isAC && !isMandatoryInstall && (
            <button
              onClick={() => {
                setIsInstallationModalOpen(true);
                posthog.capture('installation_requested', {
                  product_id: product.id,
                  product_name: product.name,
                  brand,
                  price: currentPrice,
                });
              }}
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
          className={`w-full relative overflow-hidden disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0.5 group ${inStock && isMandatoryInstall ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white' : (inStock ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200')}`}
          suppressHydrationWarning
        >
          {inStock && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
          )}
          {isMandatoryInstall ? <Wrench className="w-6 h-6 sm:w-7 sm:h-7" /> : <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />}
          
          <span className="tracking-wide">
             {inStock ? (isMandatoryInstall ? 'Alege montajul și continuă' : 'Adaugă în coș') : 'Stoc epuizat'}
          </span>
          
          {inStock && (
            <svg className="w-5 h-5 ml-1 transform group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          )}
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
        mainProductQuantity={quantity}
        preSelectedInstallation={preSelectedInstallation}
      />
    </div>
  );
}
