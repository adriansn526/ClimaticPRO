'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Settings, Sparkles, Truck, Shield } from 'lucide-react';
import { WooCommerceProduct, searchProducts } from '@/lib/woocommerce';
import { ProductSpecs } from '@/lib/productUtils';
import StickyProductBar from './StickyProductBar';
import ProductDescription from './ProductDescription';
import ProductComparison from './ProductComparison';
import { usePostHog } from 'posthog-js/react';

interface ProductSectionsProps {
  product: WooCommerceProduct;
  specs: ProductSpecs;
}

const sections = [
  { id: 'descriere', label: 'Descriere produs', Icon: FileText },
  { id: 'specificatii', label: 'Specificații tehnice', Icon: Settings },
  { id: 'caracteristici', label: 'Caracteristici', Icon: Sparkles },
  { id: 'livrare', label: 'Livrare și instalare', Icon: Truck },
  { id: 'garantie', label: 'Garanție', Icon: Shield },
];

export default function ProductSections({ product, specs }: ProductSectionsProps) {
  const [activeSection, setActiveSection] = useState('descriere');

  // Funcție pentru formatare valori atribute WooCommerce
  const formatAttributeValue = (value: string): string => {
    // Map pentru valori speciale
    const specialMappings: Record<string, string> = {
      'a-a-2': 'A++ / A+',
      'a-a-3': 'A+++ / A++',
      'a-a': 'A+++ / A+++',
      'a-plus': 'A+',
      'a-2': 'A++',
      'a-3': 'A+++',
    };

    // Check dacă există mapping special
    const lowerValue = value.toLowerCase().trim();
    if (specialMappings[lowerValue]) {
      return specialMappings[lowerValue];
    }

    // Replace cratimă cu spațiu și capitalizează fiecare cuvânt
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Funcție pentru procesare array options
  const formatAttributeOptions = (options: string[]): string => {
    if (!options || options.length === 0) return 'N/A';
    return options.map(opt => formatAttributeValue(opt)).join(', ');
  };

  // Funcție pentru căutare produse (pentru comparare)
  const handleSearchProducts = async (query: string) => {
    const results = await searchProducts(query);
    return results.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image?.sourceUrl || '/placeholder-product.jpg',
      price: p.price || 'N/A',
      specs: (p.attributes?.nodes || []).map(attr => ({
        label: attr.label || attr.name,
        value: formatAttributeOptions(attr.options || []),
      })),
    }));
  };

  // Produs curent pentru comparare
  const currentProductForCompare = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image?.sourceUrl || '/placeholder-product.jpg',
    price: product.price || 'N/A',
    specs: [
      ...(specs.btu ? [{ label: 'Capacitate răcire', value: `${specs.btu} BTU` }] : []),
      ...(specs.energyClass ? [{ label: 'Clasă energetică', value: formatAttributeValue(specs.energyClass) }] : []),
      ...(specs.area ? [{ label: 'Suprafață recomandată', value: specs.area }] : []),
      ...(specs.inverter ? [{ label: 'Tehnologie', value: 'Inverter' }] : []),
      ...(specs.wifi ? [{ label: 'Conectivitate', value: 'WiFi Smart' }] : []),
      ...(product.attributes?.nodes || [])
        .filter(attr => {
          // Exclude duplicate labels (ex: Clasă energetică care apare și în specs)
          const label = (attr.label || attr.name).toLowerCase();
          return !['clasă energetică', 'clasa energie'].includes(label) || !specs.energyClass;
        })
        .map(attr => ({
          label: attr.label || attr.name,
          value: attr.terms?.nodes?.length ? attr.terms.nodes.map((t: any) => t.name).join(', ') : formatAttributeOptions(attr.options || []),
        })),
    ],
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      const scrollPosition = window.scrollY + 150;

      for (const { id, element } of sectionElements) {
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const posthog = usePostHog();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      if (sectionId === 'specificatii') {
        posthog?.capture('product_specs_expanded', {
          product_name: product.name,
          product_id: product.id
        });
      }

      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      {/* Sticky Product Bar - Appears after scrolling past "Add to Cart" */}
      <StickyProductBar
        product={product}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {sections.map((section) => {
              const Icon = section.Icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  suppressHydrationWarning
                  style={isActive ? { backgroundColor: '#0052a3', color: '#ffffff', borderColor: '#003d7a' } : undefined}
                  className={
                    isActive
                      ? 'flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base font-medium shadow-lg border-2'
                      : 'flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Sections Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Descriere Produs */}
        <motion.section
          id="descriere"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 scroll-mt-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
            Descriere produs
          </h2>
          <ProductDescription html={product.description || product.shortDescription || '<p>Descriere indisponibilă.</p>'} />
        </motion.section>

        {/* Specificații Tehnice */}
        <motion.section
          id="specificatii"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 scroll-mt-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            Specificații tehnice - Comparator
          </h2>

          {/* Comparator Produse */}
          <ProductComparison
            currentProduct={currentProductForCompare}
            onSearchProducts={handleSearchProducts}
          />
        </motion.section>

        {/* Caracteristici */}
        <motion.section
          id="caracteristici"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 scroll-mt-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            Caracteristici principale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❄️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Răcire eficientă</h3>
                <p className="text-gray-600 text-sm">Performanță maximă de răcire pentru confort optim în orice condiții.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💨</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Funcționare silențioasă</h3>
                <p className="text-gray-600 text-sm">Nivel redus de zgomot pentru un mediu liniștit și confortabil.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Eco-friendly</h3>
                <p className="text-gray-600 text-sm">Agent frigorific R32 ecologic, protejează mediul înconjurător.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Economie energie</h3>
                <p className="text-gray-600 text-sm">Consum redus de energie pentru facturi mai mici la curent.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Livrare și Instalare */}
        <motion.section
          id="livrare"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 scroll-mt-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            Livrare și instalare
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Livrare gratuită</h3>
                <p className="text-gray-600">Transport gratuit în București și Ilfov pentru aparatele instalate de noi. Pentru alte localități sau livrare fără instalare, contactați-ne pentru detalii.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Instalare în 24h</h3>
                <p className="text-gray-600">Echipă de tehnicieni autorizați, instalare profesională în maxim 24 ore de la livrare. Include montaj unitate interioară și exterioară, racorduri, testare și punere în funcțiune.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Garanție */}
        <motion.section
          id="garantie"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-sm p-6 sm:p-8 scroll-mt-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            Garanție și service
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-xl text-primary-600 mb-3">Garanție 5 ani</h3>
              <p className="text-gray-700 mb-4">
                Toate produsele beneficiază de garanție extinsă de 5 ani, acoperind atât piese cât și manoperă.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Garanție producător: 2 ani</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Garanție extinsă ClimaticPro: 3 ani</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Service autorizat în toată țara</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Intervenție în maxim 48 ore</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
