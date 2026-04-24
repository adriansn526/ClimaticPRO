'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Search, X, Loader2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import posthog from 'posthog-js';

interface SearchProduct {
    id: number;
    slug: string;
    name: string;
    price: string;
    regularPrice?: string;
    salePrice: string | null;
    stockStatus: string;
    image: string;
    brand: string | null;
}

export default function SearchWithSuggestions({ mobile = false, onClose }: { mobile?: boolean, onClose?: () => void }) {
    const router = useRouter();
    const { addItem } = useCart();
    const { showToast } = useToast();

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (q: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.success) {
                setSuggestions(data.products);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Search error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length > 0) {
            posthog.capture('search_performed', {
                query,
                results_count: suggestions.length,
            });
            if (onClose) onClose();
            setIsOpen(false);
            // Redirect to the products archive page with search query
            router.push(`/produse?search=${encodeURIComponent(query)}`);
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: SearchProduct) => {
        e.preventDefault();
        e.stopPropagation();

        // Need to parse price
        // Price string format: "1.200 lei" or "1.200" or HTML
        // Best effort parsing
        let price = 0;
        const priceStr = product.salePrice || product.price;
        if (priceStr) {
            const clean = priceStr.replace(/[^0-9.]/g, ''); // Remove non-numeric
            price = parseFloat(clean);
        }

        addItem({
            id: product.id.toString(),
            databaseId: product.id,
            name: product.name,
            price: price.toString(),
            regularPrice: product.regularPrice || price.toString(),
            salePrice: product.salePrice,
            image: { sourceUrl: product.image, altText: product.name },
            slug: product.slug,
            stockStatus: 'IN_STOCK', // Assumed since we check before calling
        } as any, 1);
        showToast("Produs adăugat în coș", "success");
    };

    return (
        <div ref={containerRef} className={`relative w-full ${mobile ? 'h-full flex flex-col' : ''}`}>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className={`relative flex items-center ${mobile ? 'p-4 border-b bg-white' : ''}`}>
                <div className="relative w-full">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${mobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    <input
                        type="text"
                        placeholder="Caută produs (ex: Daikin, 12000 BTU)..."
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none transition-all
                            ${mobile ? 'text-base h-12 border-gray-200' : 'text-sm border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent'}
                            ${isOpen && !mobile ? 'rounded-b-none border-b-0' : ''}
                        `}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus={mobile}
                    />

                    {/* Loading / Clear Icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                        ) : query.length > 0 ? (
                            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}>
                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        ) : null}
                    </div>
                </div>
                {mobile && onClose && (
                    <button type="button" onClick={onClose} className="ml-3 text-sm font-medium text-gray-500">
                        Anulează
                    </button>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {(isOpen || mobile) && suggestions.length > 0 && (
                <div className={`
                    bg-white border-gray-200 overflow-hidden shadow-xl z-50
                    ${mobile
                        ? 'flex-1 overflow-y-auto'
                        : 'absolute top-full left-0 w-full border rounded-b-lg max-h-[450px] overflow-y-auto'
                    }
                `}>
                    <div className="divide-y divide-gray-100">
                        {suggestions.map((product) => (
                            <Link
                                key={product.id}
                                href={`/produs/${product.slug}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onClose) onClose();
                                    posthog.capture('search_product_selected', {
                                        query,
                                        product_id: product.id,
                                        product_name: product.name,
                                        product_slug: product.slug,
                                        brand: product.brand,
                                    });
                                }}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors group"
                            >
                                {/* Image */}
                                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-100">
                                    {product.image ? (
                                        <NextImage
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Search className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Brand Badge */}
                                    {product.brand && (
                                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-0.5 block tracking-wide">
                                            {product.brand}
                                        </span>
                                    )}
                                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                        {product.name}
                                    </h4>

                                    {/* Price */}
                                    <div className="flex items-center gap-2 mt-1">
                                        {product.salePrice ? (
                                            <>
                                                <span className="text-xs font-bold text-red-600" dangerouslySetInnerHTML={{ __html: product.salePrice }} />
                                                <span className="text-[10px] text-gray-400 line-through decoration-gray-400" dangerouslySetInnerHTML={{ __html: product.regularPrice || '' }} />
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: product.price }} />
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Add To Cart (Mini) */}
                                    {product.stockStatus === 'IN_STOCK' && (
                                        <button
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-primary-600 rounded-full transition-all opacity-0 group-hover:opacity-100 mobile:opacity-100"
                                            title="Adaugă în coș"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </button>
                                    )}
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State (Mobile Only) */}
            {mobile && query.length >= 2 && suggestions.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nu am găsit produse pentru "{query}"</p>
                </div>
            )}
        </div>
    );
}
