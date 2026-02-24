'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Wifi, Zap } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { extractProductSpecs, extractBrand, cleanPrice, calculateDiscount } from '@/lib/productUtils';
import { getBrandImage } from '@/lib/brandImages';
import CompareButton from '@/components/products/CompareButton';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface ProductCardProps {
  product: WooCommerceProduct;
  layout?: 'grid' | 'list';
  priority?: boolean;
}

export default function ProductCard({ product, layout = 'grid', priority = false }: ProductCardProps) {

  // Extract real product specifications
  const specs = extractProductSpecs(product);
  const brand = extractBrand(product);
  const brandSlug = product.allPaBrand?.nodes?.[0]?.slug || brand?.toLowerCase() || '';
  const brandImageInfo = getBrandImage(brandSlug);
  const productImage = product.image?.sourceUrl || '/images/product-placeholder.svg';
  const discountPercentage = calculateDiscount(product.regularPrice, product.salePrice);

  // Format attributes for compare
  const compareItem = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: productImage,
    attributes: product.attributes?.nodes.map(n => ({
      name: n.name,
      options: n.options || []
    }))
  };

  return (
    <div className={`group relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full ${layout === 'list' ? 'flex flex-row gap-4 sm:gap-6' : 'flex flex-col'
      }`}>
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

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-2">
        <div className="bg-white/90 hover:bg-white rounded-full shadow-md transition-all">
          <WishlistButton
            product={product}
            className="!p-1.5 sm:!p-2 w-8 h-8 sm:w-10 sm:h-10 !shadow-none !bg-transparent"
          />
        </div>
        <div className="bg-white/90 hover:bg-white rounded-full shadow-md transition-all">
          <CompareButton product={compareItem} className="w-8 h-8 sm:w-10 sm:h-10 p-1.5 sm:p-2" />
        </div>
      </div>

      {/* Product Image */}
      <Link href={`/produs/${product.slug}`} className={`${layout === 'list' ? 'w-1/3 sm:w-1/4 min-w-[140px] relative' : ''}`}>
        <div className={`relative aspect-square ${layout === 'list' ? 'h-full' : 'sm:aspect-[4/3]'} bg-gray-50 overflow-hidden rounded-t-lg sm:rounded-t-xl ${layout === 'list' ? 'rounded-l-lg sm:rounded-l-xl rounded-tr-none' : ''}`}>
          <NextImage
            src={productImage}
            alt={product.image?.altText || product.name}
            fill
            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-in-out mix-blend-multiply"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className={`p-2 sm:p-4 ${layout === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
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
              {brand || ''}
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/produs/${product.slug}`}>
          <h3 className="font-semibold text-xs sm:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 hover:text-primary-600 transition-colors min-h-[2rem] sm:min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {layout === 'list' && product.shortDescription && (
          <div
            className="hidden sm:block text-sm text-gray-500 mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
          />
        )}

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



        {/* Actions */}
        <div className="flex gap-1 sm:gap-2">
          <button suppressHydrationWarning className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 sm:py-3 px-1.5 sm:px-4 rounded-md sm:rounded-lg transition-colors flex items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-base" aria-label={`Adaugă ${product.name} în coș`}>
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
