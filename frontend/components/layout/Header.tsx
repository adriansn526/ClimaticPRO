'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Menu, X, Phone, Mail, ShoppingCart, Search, User, Heart, GitCompare } from 'lucide-react';
import Button from '@/components/ui/Button';
import MegaMenu from './MegaMenu';
import MobileMegaMenu from './MobileMegaMenu';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useCompare } from '@/lib/hooks/useCompare';
import CartDrawer from '@/components/cart/CartDrawer';
import { WooCommerceCategory, WooCommerceBrand, WooCommerceAttribute } from '@/lib/woocommerce';

import SearchWithSuggestions from '@/components/search/SearchWithSuggestions';

interface HeaderProps {
  categories?: WooCommerceCategory[];
  brands?: WooCommerceBrand[];
  categoryFilters: Record<string, { capacities: WooCommerceAttribute[], energyClasses: WooCommerceAttribute[], brands: WooCommerceBrand[] }>;
}

export default function Header({ categories = [], brands = [], categoryFilters }: HeaderProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New State for Mobile Search

  // Header nu e sticky pe paginile de produs
  const isProductPage = pathname?.startsWith('/produs/');
  const headerClass = isProductPage ? 'relative' : 'sticky top-0';

  const navigation = [
    { name: 'Instalare', href: '/instalare' },
    { name: 'Resurse & Ghiduri', href: '/resurse' },
    { name: 'Metode de Plata', href: '/metode-plata' },
    { name: 'Vanzari B2B', href: '/vanzari-b2b' },
  ];

  // ... (hooks remain)

  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();

  /* Scroll Animation Logic */
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      // Hysteresis logic to prevent flicker due to layout shift (~90px)
      if (y > 120 && !isScrolled) {
        setIsScrolled(true);
      } else if (y < 20 && isScrolled) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  return (
    <header className={`${headerClass} z-50 bg-white shadow-sm transition-all duration-300`}>
      {/* ... (Top Bar remains) */}

      {/* Main Header + Nav Combined on Scroll */}
      <div className={`bg-white border-b transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-14 md:h-16'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 mr-8">
              <NextImage
                src="/images/logo.png"
                alt="ClimaticPRO"
                width={isScrolled ? 140 : 160}
                height={isScrolled ? 35 : 40}
                priority
                className={`w-auto transition-all duration-300 ${isScrolled ? 'h-9' : 'h-10 md:h-11'}`}
              />
            </Link>

            {/* Scrolled Navigation */}
            <div className={`hidden md:flex items-center gap-4 flex-1 transition-opacity duration-300 ${isScrolled ? 'opacity-100 visible' : 'opacity-0 invisible w-0'}`}>
              <MegaMenu
                categories={categories}
                brands={brands}
                categoryFilters={categoryFilters}
              />
              <nav className="flex items-center gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-primary-600 text-xs font-bold uppercase tracking-wide transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop Search Bar - Replaced with Component */}
            <div className={`hidden md:flex flex-1 max-w-xl mx-8 transition-all duration-300 ${isScrolled ? 'max-w-[0px] opacity-0 hidden' : 'opacity-100'}`}>
              <SearchWithSuggestions />
            </div>

            {/* Scrolled Search Icon (Opens toggle on desktop? Or just focus?) */}
            {/* For now, let's just show it. If clicked, maybe we should scroll to top or show a mini search? 
                The user didn't specify scrolled behavior. Let's keep the existing icon but make it do something useful?
                Actually, the existing code just showed an icon. Let's make it scroll to top and focus search? 
                Or we can hide it for now to avoid confusion if we don't have a specific "mini search" design.
                Let's keep it simple.
            */}
            {isScrolled && (
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hidden md:flex p-2 text-gray-700 hover:text-primary-600 mr-4"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/cont" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <User className="w-5 h-5" />
                {!isScrolled && <span className="text-[10px] uppercase font-bold mt-0.5">Cont</span>}
              </Link>
              <Link href="/wishlist" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors relative">
                <div className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                {!isScrolled && <span className="text-[10px] uppercase font-bold mt-0.5">Favorite</span>}
              </Link>
              <Link href="/compara" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <div className="relative">
                  <GitCompare className="w-5 h-5" />
                  {compareCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                {!isScrolled && <span className="text-[10px] uppercase font-bold mt-0.5">Compara</span>}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors relative"
                aria-label="Coș cumpărături"
                suppressHydrationWarning
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                {!isScrolled && <span className="text-[10px] uppercase font-bold mt-0.5">Coș</span>}
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-3 mr-2">
              {/* NEW Mobile Search Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-700 hover:text-primary-600"
                aria-label={t('search')}
              >
                <Search className="w-5 h-5" />
              </button>

              <Link href="/cont" className="text-gray-700 hover:text-primary-600" aria-label="Contul meu">
                <User className="w-5 h-5" />
              </Link>
              <Link href="/wishlist" className="relative text-gray-700 hover:text-primary-600" aria-label="Favorite">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
              </Link>
              <Link href="/compara" className="relative text-gray-700 hover:text-primary-600" aria-label="Compară produse">
                <GitCompare className="w-5 h-5" />
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></span>
                )}
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-gray-700 hover:text-primary-600"
                aria-label="Coș cumpărături"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
              aria-label={isMenuOpen ? "Închide meniu" : "Deschide meniu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Only visible when NOT scrolled */}
      <div className={`bg-gray-50 border-b hidden md:block transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0' : 'h-10 opacity-100'}`}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center gap-6 h-full">
            <MegaMenu
              categories={categories}
              brands={brands}
              categoryFilters={categoryFilters}
            />

            <nav className="flex items-center gap-6 h-full">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 text-xs font-bold uppercase tracking-wide transition-colors flex items-center h-full"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Mega Menu */}
      <MobileMegaMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={categories}
        brands={brands}
        categoryFilters={categoryFilters}
      />

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-top-4 duration-200">
          <SearchWithSuggestions mobile={true} onClose={() => setIsSearchOpen(false)} />
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
