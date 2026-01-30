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
import CartDrawer from '@/components/cart/CartDrawer';

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // NOTE: We import these here. If CartProvider is missing, this might throw.
  // But we added it to layout.
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();

  // Header nu e sticky pe paginile de produs
  const isProductPage = pathname?.startsWith('/produs/');
  const headerClass = isProductPage ? 'relative' : 'sticky top-0';

  const navigation = [
    { name: 'Instalare', href: '/instalare' },
    { name: 'Resurse & Ghiduri', href: '/resurse' },
    { name: 'Metode de Plata', href: '/metode-plata' },
    { name: 'Vanzari B2B', href: '/vanzari-b2b' },
  ];

  /* Scroll Animation Logic */
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${headerClass} z-50 bg-white shadow-sm transition-all duration-300`}>
      {/* Top Bar - Hides on Scroll */}
      <div className={`bg-gray-800 text-white transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 py-0 opacity-0' : 'h-8 py-1 opacity-100'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-6">
              <span className="opacity-90">Montaj Aer Conditionat Bucuresti & Ilfov</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:0311006666" className="flex items-center gap-2 hover:text-gray-300 transition-colors font-bold">
                <Phone className="w-3 h-3" />
                <span>031 100 66 66</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header + Nav Combined on Scroll */}
      <div className={`bg-white border-b transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 mr-8">
              <NextImage
                src="/images/logo.png"
                alt="ClimaticPRO"
                width={isScrolled ? 160 : 180}
                height={isScrolled ? 45 : 55}
                priority
                className={`w-auto transition-all duration-300 ${isScrolled ? 'h-10' : 'h-12'}`}
              />
            </Link>

            {/* Scrolled Navigation (MegaMenu + Links) - Only visible when scrolled */}
            <div className={`hidden md:flex items-center gap-4 flex-1 transition-opacity duration-300 ${isScrolled ? 'opacity-100 visible' : 'opacity-0 invisible w-0'}`}>
              <MegaMenu />
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

            {/* Search Bar - Full on top, Hidden/Icon on scroll */}
            <div className={`hidden md:flex flex-1 max-w-xl mx-8 transition-all duration-300 ${isScrolled ? 'max-w-[0px] opacity-0 hidden' : 'opacity-100'}`}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Cauta produs..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-gray-700"
                  suppressHydrationWarning
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-primary-600" suppressHydrationWarning>
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrolled Search Icon (Replacement) */}
            {isScrolled && (
              <button className="hidden md:flex p-2 text-gray-700 hover:text-primary-600 mr-4">
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
                <GitCompare className="w-5 h-5" />
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
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
            <MegaMenu />

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
      <MobileMegaMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
