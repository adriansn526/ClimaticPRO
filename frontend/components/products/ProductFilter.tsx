'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import { Slider } from '@/components/ui/slider'; // Need to check if this exists or use standard input
import { WooCommerceCategory } from '@/lib/woocommerce';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface ProductFilterProps {
    categories: WooCommerceCategory[];
    minPrice?: number;
    maxPrice?: number;
}

export default function ProductFilter({ categories, minPrice = 0, maxPrice = 10000 }: ProductFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Sync with URL params
    useEffect(() => {
        const cat = searchParams.get('category') || '';
        setSelectedCategory(cat);

        const min = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : minPrice;
        const max = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : maxPrice;
        setPriceRange([min, max]);
    }, [searchParams, minPrice, maxPrice]);

    const applyFilters = (newCategory?: string, newPrice?: number[]) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newCategory !== undefined) {
            if (newCategory) params.set('category', newCategory);
            else params.delete('category');
        }

        if (newPrice) {
            params.set('minPrice', newPrice[0].toString());
            params.set('maxPrice', newPrice[1].toString());
        }

        router.push(`/produse?${params.toString()}`);
        setIsMobileOpen(false);
    };

    return (
        <>
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-full py-3 bg-white border border-gray-200 rounded-lg shadow-sm font-semibold text-gray-700 flex justify-between items-center px-4"
                >
                    Filtrare Produse
                    <ChevronDown className={`w-5 h-5 transition-transform ${isMobileOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className={`
        fixed inset-0 z-50 bg-white p-6 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:static lg:block lg:bg-transparent lg:p-0 lg:shadow-none lg:z-auto
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex justify-between items-center lg:hidden mb-6">
                    <h2 className="text-xl font-bold">Filtre</h2>
                    <button onClick={() => setIsMobileOpen(false)}><X className="w-6 h-6" /></button>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-4">Categorii</h3>
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="category"
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                checked={selectedCategory === ''}
                                onChange={() => applyFilters('')}
                            />
                            <span className="ml-2 text-gray-700 hover:text-primary-600">Toate categoriile</span>
                        </label>
                        {categories.map((cat) => (
                            <label key={cat.id} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="category"
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    checked={selectedCategory === cat.slug}
                                    onChange={() => applyFilters(cat.slug)}
                                />
                                <span className="ml-2 text-gray-700 hover:text-primary-600">{cat.name} ({cat.count})</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-4">Preț</h3>
                    <div className="px-2">
                        <div className="flex justify-between mb-4 text-sm text-gray-600">
                            <span>{priceRange[0]} lei</span>
                            <span>{priceRange[1]} lei</span>
                        </div>
                        <input
                            type="range"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            min={minPrice}
                            max={maxPrice}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            onMouseUp={() => applyFilters(undefined, priceRange)}
                            onTouchEnd={() => applyFilters(undefined, priceRange)}
                        />
                    </div>
                </div>

                {/* Reset Filters */}
                <button
                    onClick={() => {
                        applyFilters('', [minPrice, maxPrice]);
                        setPriceRange([minPrice, maxPrice]);
                    }}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Resetează Filtrele
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
