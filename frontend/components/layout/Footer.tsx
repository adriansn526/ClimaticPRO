'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NextImage from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('common');
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <NextImage
                src="/images/logo-white.png"
                alt="ClimaticPro"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Partener oficial Gree, Daikin și Midea. Oferim sisteme de aer condiționat premium cu instalare profesională și garanție extinsă.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Link-uri Rapide</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-primary-400 transition-colors">{t('home')}</Link></li>
              <li><Link href="/produse" className="hover:text-primary-400 transition-colors">{t('products')}</Link></li>
              <li><Link href="/servicii" className="hover:text-primary-400 transition-colors">{t('services')}</Link></li>
              <li><Link href="/despre" className="hover:text-primary-400 transition-colors">{t('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400 transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-white font-bold mb-4">Servicii</h3>
            <ul className="space-y-2">
              <li><Link href="/servicii/instalare" className="hover:text-primary-400 transition-colors">Instalare Aer Condiționat</Link></li>
              <li><Link href="/servicii/intretinere" className="hover:text-primary-400 transition-colors">Întreținere & Service</Link></li>
              <li><Link href="/servicii/curatare" className="hover:text-primary-400 transition-colors">Curățare Profesională</Link></li>
              <li><Link href="/servicii/reparatii" className="hover:text-primary-400 transition-colors">Reparații</Link></li>
              <li><Link href="/servicii/consultanta" className="hover:text-primary-400 transition-colors">Consultanță Gratuită</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+40722000000" className="hover:text-primary-400 transition-colors">
                    0722 000 000
                  </a>
                  <p className="text-xs text-gray-400">Luni - Vineri: 9:00 - 18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:contact@climaticpro.ro" className="hover:text-primary-400 transition-colors">
                  contact@climaticpro.ro
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>București, România</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {currentYear} ClimaticPro. Toate drepturile rezervate.</p>
            <div className="flex gap-6">
              <Link href="/termeni" className="hover:text-primary-400 transition-colors">Termeni și Condiții</Link>
              <Link href="/confidentialitate" className="hover:text-primary-400 transition-colors">Politică de Confidențialitate</Link>
              <Link href="/gdpr" className="hover:text-primary-400 transition-colors">GDPR</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
