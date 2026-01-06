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

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
              <Link href="/favorite" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors relative">
                <Heart className="w-5 h-5" />
                <span className="text-xs mt-1">Favorite</span>
              </Link>
              <Link href="/compara" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <GitCompare className="w-5 h-5" />
                <span className="text-xs mt-1">Compara</span>
              </Link>
              <Link href="/checkout" className="flex flex-col items-center text-gray-700 hover:text-primary-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-xs mt-1">Checkout</span>
              </Link>
              <Link href="/cos" className="flex items-center gap-2 bg-primary-600 text-gray-900 px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-semibold">Coș</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
              </Link>
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
    </header>
  );
}
