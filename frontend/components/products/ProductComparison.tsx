'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import NextImage from 'next/image';

interface ProductSpec {
  label: string;
  value: string;
}

interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: string;
  specs: ProductSpec[];
}

interface ProductComparisonProps {
  currentProduct: CompareProduct;
  onSearchProducts: (query: string) => Promise<CompareProduct[]>;
}

export default function ProductComparison({ currentProduct, onSearchProducts }: ProductComparisonProps) {
  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>([currentProduct]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompareProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearchProducts(searchQuery);
        // Exclude already added products
        const filtered = results.filter(
          r => !compareProducts.some(p => p.id === r.id)
        );
        setSearchResults(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, compareProducts, onSearchProducts]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addProduct = (product: CompareProduct) => {
    if (compareProducts.length < 4) {
      setCompareProducts([...compareProducts, product]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const removeProduct = (productId: string) => {
    if (productId !== currentProduct.id) {
      setCompareProducts(compareProducts.filter(p => p.id !== productId));
    }
  };

  // Get all unique spec labels
  const allSpecLabels = Array.from(
    new Set(compareProducts.flatMap(p => p.specs.map(s => s.label)))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-gray-900">Compară cu alte produse</h3>
        
        {/* Search Box */}
        {compareProducts.length < 4 && (
          <div ref={searchRef} className="relative w-full sm:w-auto sm:min-w-[400px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                placeholder="Caută produse pentru comparare..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 placeholder:text-gray-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <NextImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-primary-600 font-semibold">{product.price}</p>
                    </div>
                    <Plus className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-b-2 border-gray-200 px-4 py-3 text-left">
                  <span className="text-sm font-semibold text-gray-600">Specificație</span>
                </th>
                {compareProducts.map((product, index) => (
                  <th
                    key={product.id}
                    className="border-b-2 border-gray-200 px-4 py-3 min-w-[200px] max-w-[250px]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {/* Remove button (except for current product) */}
                      {index !== 0 && (
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="self-end p-1 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Elimină produs"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      )}
                      
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <NextImage
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                        />
                      </div>
                      
                      {/* Product Name */}
                      <a
                        href={`/produs/${product.slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors text-center line-clamp-2"
                      >
                        {product.name}
                      </a>
                      
                      {/* Price */}
                      <p className="text-lg font-bold text-primary-600">{product.price}</p>
                      
                      {/* Current Product Badge */}
                      {index === 0 && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                          Produs curent
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                
                {/* Add Product Column */}
                {compareProducts.length < 4 && (
                  <th className="border-b-2 border-gray-200 px-4 py-3 min-w-[200px]">
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                        <Plus className="w-8 h-8" />
                      </div>
                      <p className="text-sm text-center">
                        Adaugă până la {4 - compareProducts.length} {compareProducts.length === 3 ? 'produs' : 'produse'}
                      </p>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {allSpecLabels.map((label, labelIndex) => (
                <tr key={label} className={labelIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">
                    {label}
                  </td>
                  {compareProducts.map((product) => {
                    const spec = product.specs.find(s => s.label === label);
                    return (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-gray-900 border-b border-gray-200 text-center"
                      >
                        {spec ? spec.value : <span className="text-gray-400">—</span>}
                      </td>
                    );
                  })}
                  {compareProducts.length < 4 && (
                    <td className="px-4 py-3 border-b border-gray-200" />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
