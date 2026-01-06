'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface GalleryImage {
  sourceUrl: string;
  altText: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fallback if no images
  const displayImages = images.length > 0 
    ? images 
    : [{ sourceUrl: '/images/product-placeholder.svg', altText: productName }];

  const currentImage = displayImages[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <NextImage
          src={currentImage.sourceUrl}
          alt={currentImage.altText || productName}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Zoom Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow-md transition-all opacity-0 group-hover:opacity-100"
          aria-label="Zoom imagine"
          suppressHydrationWarning
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>

        {/* Navigation Arrows (if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all"
              aria-label="Imagine anterioară"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all"
              aria-label="Imagine următoare"
              suppressHydrationWarning
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              suppressHydrationWarning
            >
              <NextImage
                src={image.sourceUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
            aria-label="Închide"
          >
            ×
          </button>
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
            <NextImage
              src={currentImage.sourceUrl}
              alt={currentImage.altText || productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
