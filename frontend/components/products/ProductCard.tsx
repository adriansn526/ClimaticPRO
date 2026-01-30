'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Wifi, Zap } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { extractProductSpecs, extractBrand, cleanPrice, calculateDiscount } from '@/lib/productUtils';
import { getBrandImage } from '@/lib/brandImages';

interface ProductCardProps {
  product: WooCommerceProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Extract real product specifications
  const specs = extractProductSpecs(product);
  const brand = extractBrand(product);
  const brandSlug = product.allPaBrand?.nodes?.[0]?.slug || brand.toLowerCase();
  const brandImageInfo = getBrandImage(brandSlug);
  const productImage = product.image?.sourceUrl || '/images/product-placeholder.svg';
  const discountPercentage = calculateDiscount(product.regularPrice, product.salePrice);

  return (
    <div className="group relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* Badges */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 sm:gap-2">
        {product.featured && (
          <span className="bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
            Recomandat
          </span>
        )}
        {product.onSale && discountPercentage && (
          <span className="bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={() => setIsWishlisted(!isWishlisted)}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-white/90 hover:bg-white p-1.5 sm:p-2 rounded-full shadow-md transition-all"
        aria-label="Add to wishlist"
        suppressHydrationWarning
      >
        <Heart
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
        />
      </button>

      {/* Product Image */}
      <Link href={`/produs/${product.slug}`}>
        <div className="relative aspect-square sm:aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-lg sm:rounded-t-xl">
          <NextImage
            src={productImage}
            alt={product.image?.altText || product.name}
            fill
            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-in-out mix-blend-multiply"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-2 sm:p-4">
        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 min-h-[18px] sm:min-h-[24px]">
          {brandImageInfo?.imageUrl ? (
            <div className="relative h-4 sm:h-6 w-auto max-w-[60px] sm:max-w-[100px]">
              <NextImage
                src={brandImageInfo.imageUrl}
                alt={brandImageInfo.name}
                width={100}
                height={24}
                sizes="(max-width: 640px) 80px, 100px"
                className="object-contain object-left"
                unoptimized
              />
            </div>
          ) : (
            <span className="text-[10px] sm:text-xs font-semibold text-primary-600 uppercase">
              {brand}
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/produs/${product.slug}`}>
          <h3 className="font-semibold text-xs sm:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 hover:text-primary-600 transition-colors min-h-[2rem] sm:min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {/* Specs */}
        <div className="space-y-1 sm:space-y-2 mb-1.5 sm:mb-3">
          {/* BTU and Energy Class */}
          {(specs.btu || specs.energyClass) && (
            <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-sm text-gray-600">
              {specs.btu && (
                <>
                  <span className="font-medium">{specs.btu} BTU</span>
                  {specs.energyClass && <span className="text-gray-300">|</span>}
                </>
              )}
              {specs.energyClass && (
                <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] sm:text-xs font-medium">
                  {specs.energyClass}
                </span>
              )}
            </div>
          )}

          {/* Area and Features */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-500">
            {specs.area && (
              <span className="hidden sm:flex items-center gap-1">
                📐 {specs.area}
              </span>
            )}
            {specs.inverter && (
              <span className="flex items-center gap-0.5 sm:gap-1 bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Inverter
              </span>
            )}
            {specs.wifi && (
              <span className="flex items-center gap-0.5 sm:gap-1 bg-purple-50 text-purple-700 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                WiFi
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-4">
          <span className="text-base sm:text-2xl font-bold text-gray-900">
            {cleanPrice(product.price)}
          </span>
          {product.onSale && product.regularPrice && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              {cleanPrice(product.regularPrice)}
            </span>
          )}
        </div>

        {/* Trust Badges */}
        <div className="hidden sm:flex flex-wrap gap-2 text-xs text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            ✓ Livrare gratuită
          </span>
          <span className="flex items-center gap-1">
            ✓ Garanție 5 ani
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 sm:gap-2">
          <button suppressHydrationWarning className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 sm:py-3 px-1.5 sm:px-4 rounded-md sm:rounded-lg transition-colors flex items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-base">
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Adaugă în Coș</span>
            <span className="sm:hidden">Adaugă</span>
          </button>
          <Link
            href={`/produs/${product.slug}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 sm:p-3 rounded-md sm:rounded-lg transition-colors flex items-center justify-center"
            aria-label="Quick view"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Stock Status */}
        {product.stockStatus === 'IN_STOCK' && (
          <div className="mt-1.5 sm:mt-3 text-[9px] sm:text-xs text-green-600 font-medium">
            ✓ În stoc
            {product.stockQuantity && product.manageStock && (
              <span className="ml-2 text-gray-500">
                ({product.stockQuantity} buc.)
              </span>
            )}
          </div>
        )}
        {product.stockStatus === 'OUT_OF_STOCK' && (
          <div className="mt-1.5 sm:mt-3 text-[9px] sm:text-xs text-red-600 font-medium">
            ✗ Stoc epuizat
          </div>
        )}
        {product.stockStatus === 'ON_BACKORDER' && (
          <div className="mt-1.5 sm:mt-3 text-[9px] sm:text-xs text-orange-600 font-medium">
            ⏳ Disponibil la comandă
          </div>
        )}
      </div>
    </div>
  );
}
