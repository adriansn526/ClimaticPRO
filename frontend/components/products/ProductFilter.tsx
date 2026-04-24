'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WooCommerceCategory } from '@/lib/woocommerce';
import { ChevronDown, ChevronRight, X, Search } from 'lucide-react';
import Accordion from '@/components/ui/Accordion';
import { usePostHog } from 'posthog-js/react';

interface FilterAttribute {
    name: string;
    slug: string;
    count: number;
}

interface ProductFilterProps {
    categories: WooCommerceCategory[];
    filters?: {
        brands?: FilterAttribute[];
        btu?: FilterAttribute[];
        energy?: FilterAttribute[];
        categories?: Record<string, number>;
    };
    minPrice?: number;
    maxPrice?: number;
    total?: number;
    selectedCategory?: string;
    inStockDefault?: boolean;
}

// --- Internal Helper Component for Attribute Lists ---
const FilterSection = ({
    items,
    selectedItems,
    onToggle
}: {
    items: FilterAttribute[],
    selectedItems: string[],
    onToggle: (slug: string) => void
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const showSearch = items.length > 10;

    return (
        <div className="flex flex-col gap-2">
            {/* Sticky Search Input */}
            {showSearch && (
                <div className="sticky top-0 bg-white z-10 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Caută..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                    </div>
                </div>
            )}

            {/* Scrollable List */}
            <div className={`space-y-1 ${items.length > 5 ? 'max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent' : ''}`}>
                {filteredItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">Nu s-au găsit rezultate.</p>
                ) : (
                    filteredItems.map((item) => (
                        <label key={item.slug} className="flex items-center cursor-pointer group py-1">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                                checked={selectedItems.includes(item.slug)}
                                onChange={() => onToggle(item.slug)}
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-primary-700 flex-1">
                                {item.name} <span className="text-gray-400 text-xs">({item.count})</span>
                            </span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};
export default function ProductFilter({
    categories,
    filters,
    minPrice = 0,
    maxPrice = 10000,
    total,
    selectedCategory: propCategory,
    inStockDefault = true
}: ProductFilterProps) {
    const { brands = [], btu = [], energy = [] } = filters || {};
    const router = useRouter();
    const searchParams = useSearchParams();
    const posthog = usePostHog();

    const inStock = searchParams.get('inStock') !== 'false' && inStockDefault !== false;

    const selectedCategory = propCategory || searchParams.get('category') || '';

    // Helper to get array from params
    const getParamArray = (key: string) => {
        const values = searchParams.getAll(key);
        return values.length > 0 ? values : [];
    };

    const selectedBrand = getParamArray('brand');
    const selectedBtu = getParamArray('btu');
    const selectedEnergy = getParamArray('energy');

    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get('minPrice')) || minPrice,
        Number(searchParams.get('maxPrice')) || maxPrice
    ]);

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Apply filters logic
    const applyFilters = (updates: {
        category?: string;
        brand?: string[];
        btu?: string[];
        energy?: string[];
        price?: [number, number];
        inStock?: boolean;
    }) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('after'); // Reset pagination

        // Track custom event for posthog
        posthog?.capture('filter_applied', {
            filter_updates: Object.keys(updates).reduce((acc, key) => {
                if (updates[key as keyof typeof updates] !== undefined) {
                    acc[key] = updates[key as keyof typeof updates];
                }
                return acc;
            }, {} as Record<string, any>),
            category: updates.category ?? selectedCategory
        });

        // Category SEO redirect
        if (updates.category !== undefined) {
            if (updates.category) {
                const newPath = `/produse/${updates.category}`;
                params.delete('category');
                router.push(`${newPath}?${params.toString()}`, { scroll: false });
                return;
            } else {
                router.push(`/produse?${params.toString()}`, { scroll: false });
                return;
            }
        }

        const updateArrayParam = (key: string, values?: string[]) => {
            if (values !== undefined) {
                params.delete(key);
                values.forEach(v => params.append(key, v));
            }
        };

        updateArrayParam('brand', updates.brand);
        updateArrayParam('btu', updates.btu);
        updateArrayParam('energy', updates.energy);

        if (updates.price) {
            params.set('minPrice', updates.price[0].toString());
            params.set('maxPrice', updates.price[1].toString());
        }

        if (updates.inStock !== undefined) {
            params.set('inStock', updates.inStock ? 'true' : 'false');
        }

        router.push(`/produse?${params.toString()}`, { scroll: false });
    };

    const toggleFilter = (currentList: string[], item: string) => {
        return currentList.includes(item)
            ? currentList.filter(i => i !== item)
            : [...currentList, item];
    };

    // Static Count Logic for Navigation consistency
    const getStaticCount = (cat: WooCommerceCategory): number => {
        // Use Global Count from WP
        if (cat.count && cat.count > 0) return cat.count;

        // Fallback: Sum children if parent is 0 (e.g. strict categories)
        return cat.children?.nodes?.reduce((sum, child) => sum + getStaticCount(child), 0) || 0;
    };

    // Active Filters Summary Calculation
    const activeFiltersList = [
        ...selectedBrand.map(slug => ({ type: 'brand', slug, name: brands.find(b => b.slug === slug)?.name || slug })),
        ...selectedBtu.map(slug => ({ type: 'btu', slug, name: btu.find(b => b.slug === slug)?.name || slug })),
        ...selectedEnergy.map(slug => ({ type: 'energy', slug, name: energy.find(b => b.slug === slug)?.name || slug })),
    ];

    const removeFilter = (type: string, slug: string) => {
        if (type === 'brand') applyFilters({ brand: selectedBrand.filter(s => s !== slug) });
        if (type === 'btu') applyFilters({ btu: selectedBtu.filter(s => s !== slug) });
        if (type === 'energy') applyFilters({ energy: selectedEnergy.filter(s => s !== slug) });
    };

    const clearAllFilters = () => {
        applyFilters({ category: '', brand: [], btu: [], energy: [], price: [minPrice, maxPrice] });
        setPriceRange([minPrice, maxPrice]);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-full py-3 bg-white border border-gray-200 rounded-lg shadow-sm font-semibold text-gray-700 flex justify-between items-center px-4"
                >
                    Filtrare Produse
                    <ChevronDown className={`w-5 h-5 transition-transform ${isMobileOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-0 z-50 bg-white p-6 overflow-y-auto transition-transform duration-300 
                lg:translate-x-0 lg:static lg:block lg:bg-transparent lg:p-0 lg:shadow-none lg:z-auto
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex justify-between items-center lg:hidden mb-6">
                    <h2 className="text-xl font-bold">Filtre</h2>
                    <button onClick={() => setIsMobileOpen(false)}><X className="w-6 h-6" /></button>
                </div>

                {/* Toggle In Stoc */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">Doar vizibile în stoc</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={inStock} 
                                onChange={() => applyFilters({ inStock: !inStock })} 
                                title="Filtrează produse în stoc"
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${inStock ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${inStock ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>

                {/* Active Filters Summary */}
                {activeFiltersList.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtre Active</h3>
                            <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:underline">
                                Șterge tot
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeFiltersList.map((f) => (
                                <span key={`${f.type}-${f.slug}`} className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-100">
                                    {f.name}
                                    <button
                                        onClick={() => removeFilter(f.type, f.slug)}
                                        className="ml-1 hover:text-primary-900 focus:outline-none"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                <Accordion title="Categorii" defaultOpen={true}>
                    <div className="flex flex-col gap-1">
                        <Link
                            href="/produse"
                            className={`
                                block max-w-full truncate px-3 py-2 rounded-md text-sm transition-all duration-200
                                ${selectedCategory === ''
                                    ? 'bg-primary-50 text-primary-700 font-semibold border-l-4 border-primary-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                }
                            `}
                        >
                            Toate
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/produse/${cat.slug}`}
                                className={`
                                    block max-w-full truncate px-3 py-2 rounded-md text-sm transition-all duration-200
                                    ${selectedCategory === cat.slug
                                        ? 'bg-primary-50 text-primary-700 font-semibold border-l-4 border-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{cat.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Accordion>

                {/* Price Range */}
                <Accordion title="Preț">
                    <div className="px-1 py-4">
                        <div className="flex justify-between mb-4 text-sm text-gray-600 font-medium">
                            <span>{priceRange[0]} lei</span>
                            <span>{priceRange[1]} lei</span>
                        </div>
                        <input
                            type="range"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            min={minPrice}
                            max={maxPrice}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            onMouseUp={() => applyFilters({ price: priceRange })}
                            onTouchEnd={() => applyFilters({ price: priceRange })}
                        />
                    </div>
                </Accordion>

                {/* Attribute Filters using FilterSection */}
                {brands.length > 0 && (
                    <Accordion title="Brand">
                        <FilterSection
                            items={brands}
                            selectedItems={selectedBrand}
                            onToggle={(slug) => applyFilters({ brand: toggleFilter(selectedBrand, slug) })}
                        />
                    </Accordion>
                )}

                {btu.length > 0 && (
                    <Accordion title="Capacitate (BTU)">
                        <FilterSection
                            items={btu}
                            selectedItems={selectedBtu}
                            onToggle={(slug) => applyFilters({ btu: toggleFilter(selectedBtu, slug) })}
                        />
                    </Accordion>
                )}

                {energy.length > 0 && (
                    <Accordion title="Clasa Energetică">
                        <FilterSection
                            items={energy}
                            selectedItems={selectedEnergy}
                            onToggle={(slug) => applyFilters({ energy: toggleFilter(selectedEnergy, slug) })}
                        />
                    </Accordion>
                )}

                {/* Footer Reset Button (Only if filters active, effectively handled by Clear All at top, 
                   but keeping bottom reset for convenience if desired, or removing to clean up UI. 
                   User asked for improvements. The top clear all is better.
                   I will keep a subtle bottom reset just in case scrolling down.)
                */}
                {(selectedBrand.length > 0 || selectedBtu.length > 0 || selectedEnergy.length > 0 || priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                    <button
                        onClick={clearAllFilters}
                        className="w-full mt-6 py-2 bg-white text-gray-500 rounded border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs font-medium uppercase tracking-wide"
                    >
                        Resetează Tot
                    </button>
                )}
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
