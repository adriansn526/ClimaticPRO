'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { Banner } from '@/lib/wordpress';
import { usePostHog } from 'posthog-js/react';

interface HeroSectionProps {
  banners: Banner[];
  children?: React.ReactNode;
}

export default function HeroSection({ banners, children }: HeroSectionProps) {
  const posthog = usePostHog();
  // Fallback la imagini locale dacă WordPress nu returnează bannere
  const defaultBanners: Banner[] = [
    {
      id: '1',
      title: 'Banner Default 1',
      sourceUrl: '/banners/banner-1.jpg',
      altText: 'Banner 1',
      mediaDetails: { width: 1920, height: 600, file: 'banner-1.jpg' }
    },
    {
      id: '2',
      title: 'Banner Default 2',
      sourceUrl: '/banners/banner-2.jpg',
      altText: 'Banner 2',
      mediaDetails: { width: 1920, height: 600, file: 'banner-2.jpg' }
    },
  ];

  const safeBanners = Array.isArray(banners) ? banners : [];
  const displayBanners = safeBanners.length > 0 ? safeBanners : defaultBanners;
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
            {children}
          </div>

          {/* Banner Slider - Dreapta */}
          <div className="flex-1 relative overflow-hidden">
            {displayBanners.length > 0 && displayBanners[currentSlide] && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: currentSlide === 0 ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="relative w-full h-full cursor-pointer"
                  >
                    <Link
                      href="/instalare"
                      onClick={() => posthog?.capture('homepage_banner_clicked', { banner_name: displayBanners[currentSlide].title, banner_id: displayBanners[currentSlide].id })}
                      className="block w-full h-full relative z-10"
                    >
                      <NextImage
                        src={displayBanners[currentSlide].sourceUrl}
                        alt={displayBanners[currentSlide].altText || displayBanners[currentSlide].title}
                        fill
                        className="object-contain"
                        priority={currentSlide === 0}
                        sizes="(max-width: 1024px) 100vw, calc(100vw - 260px)"
                      />
                    </Link>
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
