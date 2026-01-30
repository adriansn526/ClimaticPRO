'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NextImage from 'next/image';
import { Banner } from '@/lib/bannere';

interface HeroSectionProps {
  banners: Banner[];
  children?: React.ReactNode;
}

export default function HeroSection({ banners, children }: HeroSectionProps) {
  // Fallback la imagini locale dacă WordPress nu returnează bannere
  const defaultBanners: Banner[] = [
    {
      id: '1',
      title: 'Banner Default 1',
      bannerSettings: {
        locatie: ['homepage_hero'],
        imagineDesktop: {
          sourceUrl: '/banners/banner-1.jpg',
          altText: 'Banner 1',
          mediaDetails: { width: 1920, height: 600 }
        },
        activ: true,
        ordine: 0
      }
    },
    {
      id: '2',
      title: 'Banner Default 2',
      bannerSettings: {
        locatie: ['homepage_hero'],
        imagineDesktop: {
          sourceUrl: '/banners/banner-2.jpg',
          altText: 'Banner 2',
          mediaDetails: { width: 1920, height: 600 }
        },
        activ: true,
        ordine: 1
      }
    },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Reset currentSlide if it's out of bounds
  useEffect(() => {
    if (currentSlide >= displayBanners.length) {
      setCurrentSlide(0);
    }
  }, [displayBanners.length, currentSlide]);

  useEffect(() => {
    if (!isAutoPlaying || displayBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayBanners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative w-full bg-gray-100">
      {/* Container cu margini ca la header */}
      <div className="container mx-auto px-4 relative">
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex">
          {/* Meniu Vertical - Stânga */}
          <div className="hidden lg:flex w-64 bg-white z-20 flex-col">
            {/* Titlu GAMA DE PRODUSE */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-center py-3 px-4">
              GAMA DE PRODUSE
            </div>
            {/* Meniul propriu-zis */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>

          {/* Banner Slider - Dreapta */}
          <div className="flex-1 relative overflow-hidden">
            {displayBanners.length > 0 && displayBanners[currentSlide] && displayBanners[currentSlide].bannerSettings.imagineDesktop && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="relative w-full h-full"
                  >
                    <NextImage
                      src={displayBanners[currentSlide].bannerSettings.imagineDesktop.sourceUrl}
                      alt={displayBanners[currentSlide].bannerSettings.imagineDesktop.altText || displayBanners[currentSlide].title}
                      fill
                      className="object-cover"
                      priority={currentSlide === 0}
                      sizes="100vw"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Navigation Arrows */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
              <button
                onClick={prevSlide}
                className="pointer-events-auto bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Previous slide"
                suppressHydrationWarning
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>

              <button
                onClick={nextSlide}
                className="pointer-events-auto bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Next slide"
                suppressHydrationWarning
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {displayBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
