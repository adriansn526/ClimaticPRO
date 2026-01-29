'use client';

import { useState } from 'react';
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

  // Conditionally render hooks only after client hydration to avoid mismatch if needed,
  // but since this is 'use client', standard hook usage is fine.
  // We need to handle optional context if somehow used outside provider, but we wrapped layout.

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

  return (
    <header className={`${headerClass} z-50 bg-white shadow-sm`}>
      {/* Top Bar */}
      <div className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <span className="text-xs">AER CONDIȚIONAT - Montaj Aparate Aer Conditionat in Bucuresti si Imprejurimi - ClimaticPRO</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:0311006666" className="flex items-center gap-2 hover:text-gray-300 transition-colors font-semibold">
                <Phone className="w-4 h-4" />
                <span>031 100 66 66</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <NextImage
                src="/images/logo.png"
                alt="ClimaticPRO"
                width={220}
                height={70}
                priority
                className="h-16 w-auto"
              />
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Cauta dupa tipul produsului, model sau alte caracteristici..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700"
                  suppressHydrationWarning
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600" suppressHydrationWarning>
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/cont" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <User className="w-5 h-5" />
                <span className="text-xs mt-1">Contul meu</span>
              </Link>
              <Link href="/wishlist" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors relative">
                <div className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <span className="text-xs mt-1">Favorite</span>
              </Link>
              <Link href="/compara" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <GitCompare className="w-5 h-5" />
                <span className="text-xs mt-1">Compara</span>
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors relative"
                aria-label="Coș cumpărături"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">Coș</span>
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

      {/* Navigation Bar */}
      <div className="bg-gray-50 border-b hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <MegaMenu />

            <nav className="flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 text-sm font-medium transition-colors"
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
