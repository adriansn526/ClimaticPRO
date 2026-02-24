'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, ShoppingCart, Plus, Minus, Package, Truck, Info, X, Menu, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function MarketplacePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'ac' | 'consumables' | 'tools'>('consumables');
    const [activeCategory, setActiveCategory] = useState('all');

    // Filters State
    const [activeFilters, setActiveFilters] = useState<{ brands: string[], btus: string[], energyClasses: string[] }>({ brands: [], btus: [], energyClasses: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [cart, setCart] = useState<{ id: string, qty: number }[]>([]);

    // Real Data State
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // These will be subcategories if available
    const [loading, setLoading] = useState(true);

    // Fetch Data on Tab Change
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        async function fetchData() {
            setLoading(true);
            try {
                // Determine fetch slug based on tab
                let categorySlug = '';
                if (activeTab === 'consumables') categorySlug = 'consumabile-si-accesorii';
                if (activeTab === 'tools') categorySlug = 'unelte';
                // For 'ac', we fetch all (or specific AC root if exists) and client-filter or rely on backend.
                // Current backend excludes services.

                const url = `/api/dispatch/products?category=${categorySlug}`;
                const res = await fetch(url, { signal });
                const data = await res.json();

                if (data.success) {
                    setProducts(data.products);
                    // Update categories (subcategories) for the current view
                    // Ensure we don't lose them if api returns empty types
                    if (data.categories) setCategories(data.categories);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('B2B Fetch Error', error);
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchData();
        return () => controller.abort();
    }, [activeTab]); // Refetch when tab changes

    const filteredProducts = products.filter(p => {
        // 1. Text Search
        if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // 2. Tab Specific Logic (Client Side Refinement)
        if (activeTab === 'ac') {
            const acKeywords = ['aer', 'split', 'coloana', 'caseta', 'duct', 'plaf', 'ventiloconvector', 'multisplit', 'vrf'];
            const isAC = acKeywords.some(k => (p.category || '').toLowerCase().includes(k) || p.name.toLowerCase().includes(k)) || (p.btu && p.btu.length > 0);

            // If we fetched 'all', strictly keep ACs here
            if (!isAC) return false;

            // Side Filters
            if (activeFilters.brands.length > 0 && !activeFilters.brands.some(b => p.brand?.toLowerCase().includes(b.toLowerCase()))) return false;
            if (activeFilters.btus.length > 0 && !activeFilters.btus.some(b => p.btu?.includes(b))) return false;
            if (activeFilters.energyClasses.length > 0 && !activeFilters.energyClasses.some(c => p.energy_class?.toLowerCase().includes(c.toLowerCase()))) return false;

            // Filter by "Type" (Category Logic)
            if (activeCategory !== 'all' && p.category !== activeCategory) return false;
        } else {
            // For Consumables/Tools, we rely on the API fetching the right category.
            // But we can filter by sub-category if selected
            if (activeCategory !== 'all' && p.category !== activeCategory) return false;
        }

        return true;
    });

    const addToCart = (id: string, qty: number) => {
        if (qty <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.id === id);
            if (existing) {
                return prev.map(item => item.id === id ? { ...item, qty: item.qty + qty } : item);
            }
            return [...prev, { id, qty }];
        });
        showToast('Adăugat în comandă!', 'success');
    };

    const cartTotal = cart.reduce((acc, item) => {
        const prod = products.find(p => p.id === item.id);
        return acc + (prod ? prod.pro_price * item.qty : 0);
    }, 0);

    const [submitting, setSubmitting] = useState(false);

    const handleOrder = async () => {
        if (!user) {
            showToast("Trebuie să fii autentificat.", "error");
            return;
        }

        setSubmitting(true);
        try {
            // Prepare Items
            const orderItems = cart.map(item => {
                const prod = products.find(p => p.id === item.id);
                return {
                    productId: prod?.id,
                    name: prod?.name,
                    quantity: item.qty,
                    price: prod?.pro_price,
                    supplierData: prod?.suppliers // Pass supplier info if needed for routing
                };
            });

            const res = await fetch('/api/b2b/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    installerId: user.id || 'unknown', // Fallback
                    items: orderItems,
                    totalAmount: cartTotal
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast("Comanda a fost trimisă cu succes!", "success");
                setCart([]); // Clear Cart
            } else {
                showToast("Eroare la trimiterea comenzii.", "error");
            }
        } catch (error) {
            showToast("Eroare de conexiune.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Content Component to reuse in Mobile/Desktop
    const FilterContent = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between md:hidden pb-4 border-b">
                <h3 className="font-bold text-gray-900">Filtre</h3>
                <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Categories List (Requested for all tabs) */}
            {activeTab !== 'ac' && (
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Categorii</h4>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Toate
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.slug)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === cat.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Special Filters for AC */}
            {activeTab === 'ac' && (
                <>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Tip Aparat</h4>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Toate
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.slug)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${activeCategory === cat.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Brand</h4>
                        <div className="space-y-2">
                            {['Midea', 'Gree', 'Daikin', 'Samsung', 'Mitsubishi', 'Aux', 'Kyato'].map(brand => (
                                <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={activeFilters.brands.includes(brand)}
                                        onChange={(e) => {
                                            if (e.target.checked) setActiveFilters({ ...activeFilters, brands: [...activeFilters.brands, brand] });
                                            else setActiveFilters({ ...activeFilters, brands: activeFilters.brands.filter(b => b !== brand) });
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Capacitate</h4>
                        <div className="space-y-2">
                            {['9000', '12000', '18000', '24000'].map(btu => (
                                <label key={btu} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={activeFilters.btus.includes(btu)}
                                        onChange={(e) => {
                                            if (e.target.checked) setActiveFilters({ ...activeFilters, btus: [...activeFilters.btus, btu] });
                                            else setActiveFilters({ ...activeFilters, btus: activeFilters.btus.filter(b => b !== btu) });
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">{btu} BTU</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Clasa Energetica</h4>
                        <div className="space-y-2">
                            {['A+++', 'A++', 'A+', 'A'].map(cls => (
                                <label key={cls} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={activeFilters.energyClasses.includes(cls)}
                                        onChange={(e) => {
                                            if (e.target.checked) setActiveFilters({ ...activeFilters, energyClasses: [...activeFilters.energyClasses, cls] });
                                            else setActiveFilters({ ...activeFilters, energyClasses: activeFilters.energyClasses.filter(c => c !== cls) });
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">{cls}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/cont/instalator" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Magazin Pro</h1>
                            <p className="text-xs text-green-600 font-medium flex items-center">
                                <CheckCircleIcon className="w-3 h-3 mr-1" /> Prețuri Partener Active
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Caută..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Mobile Filter Button */}
                        <button
                            className="md:hidden p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                            onClick={() => setShowMobileFilters(true)}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="max-w-7xl mx-auto px-4 flex space-x-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => { setActiveTab('consumables'); setActiveCategory('all'); }}
                        className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'consumables'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Consumabile & Accesorii
                    </button>
                    <button
                        onClick={() => { setActiveTab('ac'); setActiveCategory('all'); }}
                        className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'ac'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Aer Condiționat
                    </button>
                    <button
                        onClick={() => { setActiveTab('tools'); setActiveCategory('all'); }}
                        className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'tools'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Unelte
                    </button>
                </div>
            </div>

            {/* Mobile Filter Overlay (Drawer) */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 flex justify-end md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
                    <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex-1 overflow-y-auto p-4">
                            <FilterContent />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                Vezi {filteredProducts.length} Rezultate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6 items-start mt-4">

                {/* DESKTOP SIDEBAR FILTERS */}
                <div className="hidden md:block w-64 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-shrink-0 sticky top-24">
                    <FilterContent />
                </div>

                {/* Product Grid */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <ProductRow key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                    )}
                    {!loading && filteredProducts.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Nu am găsit produse.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Cart Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl p-4 z-20 animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600 relative">
                                <ShoppingCart className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Estimativ</p>
                                <p className="text-xl font-bold text-gray-900">{cartTotal} RON</p>
                            </div>
                        </div>
                        <button
                            onClick={handleOrder}
                            disabled={submitting}
                            className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? 'Se trimite...' : 'Trimite Comanda'}
                            {!submitting && <Truck className="w-5 h-5 ml-2" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProductRow({ product, onAdd }: { product: any, onAdd: (id: string, qty: number) => void }) {
    const [qty, setQty] = useState(1);

    return (
        <div className="bg-white border boundary-gray-200 rounded-lg p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 relative">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    {/* Title Cleaning: remove 'Aparat de aer conditionat' case insensitive */}
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                        {product.name.replace(/aparat de aer conditionat/gi, '').trim()}
                    </h3>
                    <div className="flex flex-col items-end gap-1 ml-2">
                        {product.stock === 'in_stock' || (typeof product.stock === 'number' && product.stock > 0) ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded whitespace-nowrap font-medium border border-emerald-100">
                                {typeof product.stock === 'number' ? `${product.stock} ${product.unit}` : 'In Stoc'}
                            </span>
                        ) : (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded whitespace-nowrap font-medium border border-red-100">
                                Stoc Epuizat
                            </span>
                        )}
                        {product.btu && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded whitespace-nowrap font-bold">
                                {product.btu} BTU
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-blue-600">{product.pro_price} RON</span>
                    {product.price > product.pro_price && (
                        <>
                            <span className="text-xs text-gray-400 line-through">{product.price} RON</span>
                            <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded font-bold">
                                -{Math.round((1 - product.pro_price / product.price) * 100)}%
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 border-r border-gray-300"
                            onClick={() => setQty(Math.max(1, qty - 1))}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            className="w-12 text-center text-sm border-none py-1 focus:ring-0"
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                        />
                        <button
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 border-l border-gray-300"
                            onClick={() => setQty(qty + 1)}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    <button
                        onClick={() => onAdd(product.id, qty)}
                        className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold py-1.5 rounded uppercase tracking-wide flex items-center justify-center"
                    >
                        Adaugă
                    </button>
                </div>
            </div>
        </div>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    )
}
