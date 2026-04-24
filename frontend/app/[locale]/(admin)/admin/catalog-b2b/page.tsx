'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Package, Check, X, TrendingUp, Bell } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import PostHogFilters, { FilterCondition } from '@/components/admin/PostHogFilters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SupplierLink {
    supplier: { name: string };
    supplierPrice: number;
    supplierStock: string;
    supplierProductUrl: string;
    priceLastChangedAt?: string | null;
}

interface B2BProduct {
    id: number;
    sku: string | null;
    name: string;
    slug: string;
    capacity: string | null;
    priceB2B: number;
    priceRetail: number | null;
    stock: number;
    unit: string;
    image: string | null;
    active: boolean;
    isPriceOverridden: boolean;
    manageStock: boolean;
    wooCategoryIds: number[];
    marginValue: number;
    marginType: string;
    createdAt: string;
    syncToWooCommerce: boolean;
    forceInstallation: boolean;
    suppliers?: SupplierLink[];
    computedStockStatus?: string;
    repricerMeta?: string | null;
    latestPriceChange?: string | null;
}

export default function B2BCatalogPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<B2BProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFiltered, setTotalFiltered] = useState<number>(0);
    const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0, priceChangedCount: 0 });
    const [wooCategories, setWooCategories] = useState<{id: string, databaseId: number, name: string, count: number}[]>([]);
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({key: 'createdAt', direction: 'desc'});

    const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
    const [editPriceB2B, setEditPriceB2B] = useState<number>(0);
    const [editPriceRetail, setEditPriceRetail] = useState<number | null>(null);
    const [editIsOverridden, setEditIsOverridden] = useState<boolean>(false);
    const [editMarginValue, setEditMarginValue] = useState<number>(10);
    const [editMarginType, setEditMarginType] = useState<string>('PERCENT');
    const [editWooCategoryIds, setEditWooCategoryIds] = useState<number[]>([]);
    const [editSyncWoo, setEditSyncWoo] = useState<boolean>(false);
    const [editForceInstallation, setEditForceInstallation] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState(false);

    // Bulk Actions State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [bulkMarginValue, setBulkMarginValue] = useState('');
    const [bulkMarginType, setBulkMarginType] = useState('PERCENT');
    const [bulkWooCategoryIds, setBulkWooCategoryIds] = useState<number[]>([]);


    // Accordion State
    const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset la curat cand se modifica filtrul
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
        setPage(1);
    };

    useEffect(() => {
        fetchProducts();
    }, [page, debouncedSearch, filters, sortConfig]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/admin/woo-categories');
                const data = await res.json();
                if (data.success) {
                    setWooCategories(data.categories || []);
                }
            } catch (err) {
                console.error("Failed to fetch woo categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await fetch('/api/admin/suppliers');
                const data = await res.json();
                if (data.success) {
                    setSuppliers(data.suppliers || []);
                }
            } catch (err) {}
        };
        fetchSuppliers();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: page.toString(),
                limit: '50',
                search: debouncedSearch,
                sortField: sortConfig.key,
                sortDir: sortConfig.direction
            };
            filters.forEach(f => {
                if (f.field === 'categoryIds' || f.field === 'supplierIds') {
                    // Handle both old format (array) and new format ({ids, exclude})
                    const val = f.value;
                    const ids = Array.isArray(val) ? val : (val?.ids || []);
                    const exclude = val?.exclude || false;
                    params[f.field] = ids.join(',');
                    if (exclude) params[`${f.field}Exclude`] = 'true';
                } else if (typeof f.value === 'object' && f.value !== null && ('min' in f.value || 'max' in f.value)) {
                    // Range filter: send as fieldMin and fieldMax
                    if (f.value.min !== undefined && f.value.min !== '') params[`${f.field}Min`] = f.value.min;
                    if (f.value.max !== undefined && f.value.max !== '') params[`${f.field}Max`] = f.value.max;
                } else {
                    params[f.field] = String(f.value);
                }
            });
            const query = new URLSearchParams(params);
            const res = await fetch(`/api/admin/b2b-products?${query.toString()}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
                setTotalPages(data.totalPages || 1);
                setTotalFiltered(data.total || 0);
                if (data.metrics) {
                    setMetrics(data.metrics);
                }
            } else {
                showToast("Nu s-au putut încărca produsele.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Eroare de conexiune.", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/b2b-products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Status actualizat cu succes.", "success");
                setProducts(products.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
            } else {
                showToast("Eroare la actualizare.", "error");
            }
        } catch (error) {
            showToast("Eroare de rețea.", "error");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriți să ștergeți acest produs din catalogul B2B?")) return;

        try {
            const res = await fetch(`/api/admin/b2b-products?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showToast("Produs șters cu succes.", "success");
                setProducts(products.filter(p => p.id !== id));
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            } else {
                showToast("Eroare la ștergere.", "error");
            }
        } catch (error) {
            showToast("Eroare de rețea.", "error");
        }
    };

    const handleBulkAction = async (updates: any) => {
        if (selectedIds.length === 0) return;
        setIsBulkLoading(true);
        try {
             const res = await fetch(`/api/admin/b2b-products`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'bulk', productIds: selectedIds, bulkUpdates: updates })
             });
             const data = await res.json();
             if (data.success) {
                  showToast(`${selectedIds.length} produse actualizate.`, 'success');
                  setSelectedIds([]);
                  setTimeout(() => fetchProducts(), 500); // Give the background repricer a moment to update DB
             } else {
                  showToast('Eroare Bulk Update', 'error');
             }
        } catch(err) {
             showToast('Eroare rețea', 'error');
        } finally {
             setIsBulkLoading(false);
        }
    };

    const handleSelectAllFiltered = async () => {
        setIsBulkLoading(true);
        try {
             const params: any = {
                 search: debouncedSearch,
                 sortField: sortConfig.key,
                 sortDir: sortConfig.direction,
                 getAllIds: 'true'
             };
             filters.forEach(f => {
                 if (f.field === 'categoryIds' || f.field === 'supplierIds') {
                     params[f.field] = Array.isArray(f.value) ? f.value.join(',') : '';
                 } else {
                     params[f.field] = String(f.value);
                 }
             });
             const query = new URLSearchParams(params);
             const res = await fetch(`/api/admin/b2b-products?${query.toString()}`);
             const data = await res.json();
             if (data.success && data.ids) {
                  setSelectedIds(data.ids);
                  showToast(`${data.ids.length} produse selectate.`, 'success');
             } else {
                  showToast('Nu s-au putut prelua toate produsele', 'error');
             }
        } catch(err) {
             showToast('Eroare rețea', 'error');
        } finally {
             setIsBulkLoading(false);
        }
    };


    const handleEditClick = (product: B2BProduct) => {
        setEditingProduct(product);
        setEditPriceB2B(product.priceB2B);
        setEditPriceRetail(product.priceRetail);
        setEditIsOverridden(product.isPriceOverridden || false);
        setEditMarginValue(product.marginValue ?? 10);
        setEditMarginType(product.marginType || 'PERCENT');
        setEditWooCategoryIds(Array.isArray(product.wooCategoryIds) ? product.wooCategoryIds : []);
        setEditSyncWoo(product.syncToWooCommerce || false);
        setEditForceInstallation(product.forceInstallation || false);
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/b2b-products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingProduct.id,
                    priceB2B: editPriceB2B,
                    priceRetail: editPriceRetail,
                    isPriceOverridden: editIsOverridden,
                    marginValue: editMarginValue,
                    marginType: editMarginType,
                    wooCategoryIds: editWooCategoryIds,
                    syncToWooCommerce: editSyncWoo,
                    forceInstallation: editForceInstallation
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Configurația produsului a fost salvată.", "success");
                setProducts(products.map(p => p.id === editingProduct.id ? { 
                    ...p, 
                    priceB2B: editPriceB2B, 
                    priceRetail: editPriceRetail, 
                    isPriceOverridden: editIsOverridden,
                    marginValue: editMarginValue,
                    marginType: editMarginType,
                    wooCategoryIds: editWooCategoryIds,
                    syncToWooCommerce: editSyncWoo
                } : p));
                setEditingProduct(null);
            } else {
                showToast("Eroare la salvare: " + data.message, "error");
            }
        } catch (error) {
            showToast("Eroare de conexiune la server.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Catalog Produse B2B</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Produs Nou
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Produse</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.total}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Produse Active</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.active}</h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Check className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Produse Inactive</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.inactive}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <X className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Price Change Notification Banner */}
            {metrics.priceChangedCount > 0 && (
                <div 
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors shadow-sm"
                    onClick={() => { setSortConfig({ key: 'priceChanged', direction: 'desc' }); setPage(1); }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900 text-sm">
                                ⚡ {metrics.priceChangedCount} modificări de preț în ultimele 24h
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">Click pentru a sorta produsele după cele mai recente schimbări de preț</p>
                        </div>
                    </div>
                    <div className="text-amber-600 text-xs font-bold bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                        Vezi Toate →
                    </div>
                </div>
            )}

            {/* Search and Advanced Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="relative w-full max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Caută după nume sau SKU..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="border-t border-gray-100 pt-3">
                    <PostHogFilters 
                        filters={filters}
                        onChange={(newFilters) => { setFilters(newFilters); setPage(1); }}
                        wooCategories={wooCategories}
                        suppliers={suppliers}
                    />
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedIds.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 border border-gray-200 transition-all z-20 relative">
                    <div className="text-gray-800 font-bold flex items-center justify-between w-full md:w-auto gap-3 whitespace-nowrap pl-2">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm tracking-wide">{selectedIds.length} selectate</span>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-gray-700 md:hidden transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-200 items-center overflow-x-auto max-w-full hide-scrollbar gap-2 ring-1 ring-black/5 mx-auto md:mx-0 shadow-inner">
                        
                        {/* Adaos */}
                        <div className="flex bg-white rounded-md overflow-hidden shrink-0 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                             <input 
                                 type="number"
                                 placeholder="Adaos"
                                 value={bulkMarginValue}
                                 onChange={e => setBulkMarginValue(e.target.value)}
                                 className="w-16 px-2 py-1.5 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-xs font-semibold"
                             />
                             <select 
                                 value={bulkMarginType}
                                 onChange={e => setBulkMarginType(e.target.value)}
                                 className="bg-gray-50 text-gray-700 px-1 outline-none font-semibold text-xs border-l border-gray-200 cursor-pointer hover:bg-gray-100"
                             >
                                 <option value="PERCENT">%</option>
                                 <option value="FIXED">RON</option>
                             </select>
                             <button
                                 onClick={() => {
                                      if (!bulkMarginValue) return alert('Introdu valoarea adaosului');
                                      handleBulkAction({ marginValue: bulkMarginValue, marginType: bulkMarginType });
                                 }}
                                 disabled={isBulkLoading}
                                 className="px-3 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 border-l border-blue-100 transition-colors"
                             >
                                 Aplică
                             </button>
                        </div>

                        {/* Categorii */}
                        <div className="flex bg-white rounded-md overflow-hidden shrink-0 relative group shadow-sm border border-gray-200">
                             <div className="bg-transparent text-gray-700 px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                                 <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                 {bulkWooCategoryIds.length === 0 ? "Categ. Woo" : `${bulkWooCategoryIds.length} categ.`}
                             </div>
                             
                             <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 hidden group-hover:block z-50 max-h-60 overflow-y-auto ring-1 ring-black/5">
                                 {wooCategories.map(c => (
                                     <label key={c.databaseId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-700 text-xs font-medium transition-colors">
                                         <input 
                                            type="checkbox" 
                                            checked={bulkWooCategoryIds.includes(c.databaseId)}
                                            onChange={(e) => {
                                                if (e.target.checked) setBulkWooCategoryIds([...bulkWooCategoryIds, c.databaseId]);
                                                else setBulkWooCategoryIds(bulkWooCategoryIds.filter(id => id !== c.databaseId));
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                         />
                                         <span className="truncate">{c.name}</span>
                                     </label>
                                 ))}
                             </div>

                             <button
                                 onClick={() => {
                                      if (bulkWooCategoryIds.length === 0) return alert('Selectează minim o categorie din listă');
                                      handleBulkAction({ wooCategoryIds: bulkWooCategoryIds });
                                 }}
                                 disabled={isBulkLoading}
                                 className="px-3 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 border-l border-blue-100 transition-colors"
                             >
                                 Asign.
                             </button>
                        </div>
                        
                        <div className="w-[1px] h-5 bg-gray-300 mx-1 shrink-0" />

                        {/* Sync Woo */}
                        <div className="flex bg-white rounded-md border border-gray-200 shrink-0 overflow-hidden shadow-sm hidden md:flex">
                            <button 
                                 onClick={() => handleBulkAction({ syncToWooCommerce: true })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-emerald-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border-r border-gray-200 group"
                            >
                                <svg className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                Sync Da
                            </button>
                            <button 
                                 onClick={() => handleBulkAction({ syncToWooCommerce: false })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-red-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 group"
                            >
                                <svg className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Sync Nu
                            </button>
                        </div>

                        {/* Override */}
                        <div className="flex bg-white rounded-md border border-gray-200 shrink-0 overflow-hidden shadow-sm">
                            <button 
                                 onClick={() => handleBulkAction({ isPriceOverridden: true })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-orange-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border-r border-gray-200 group"
                            >
                                <svg className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                Preț Fix
                            </button>
                            <button 
                                 onClick={() => handleBulkAction({ isPriceOverridden: false })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-blue-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 group"
                            >
                                <svg className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                                Preț Dinamic
                            </button>
                        </div>

                        {/* Montaj */}
                        <div className="flex bg-white rounded-md border border-gray-200 shrink-0 overflow-hidden shadow-sm hidden xl:flex">
                            <button 
                                 onClick={() => handleBulkAction({ forceInstallation: true })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-purple-50 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border-r border-gray-200 group"
                            >
                                <svg className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Montaj Da
                            </button>
                            <button 
                                 onClick={() => handleBulkAction({ forceInstallation: false })}
                                 disabled={isBulkLoading}
                                 className="px-3 py-1.5 bg-transparent hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 group"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
                                Montaj Nu
                            </button>
                        </div>
                    </div>

                    <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-gray-700 p-2 hidden md:flex shrink-0 transition-colors bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            {/* Promo banner for Select All */}
            {selectedIds.length === products.length && totalFiltered > products.length && (
                <div className="bg-gray-50 text-gray-700 py-3 px-4 rounded-xl border border-gray-200 text-center text-sm font-medium flex flex-col md:flex-row items-center justify-center gap-3 animate-in slide-in-from-top-2 shadow-sm">
                    <span>Toate cele <strong className="text-gray-900">{products.length}</strong> produse de pe această pagină sunt selectate.</span>
                    <button 
                        className="text-blue-700 bg-blue-50 px-4 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-sm border border-blue-200 hover:border-blue-300"
                        onClick={handleSelectAllFiltered}
                        disabled={isBulkLoading}
                    >
                        {isBulkLoading ? 'Se încarcă...' : (
                            <>
                                <Check className="w-4 h-4 text-blue-600" />    
                                Selectează toate cele {totalFiltered} produse
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-4 w-12">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedIds(products.map(p => p.id));
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }}
                                    checked={selectedIds.length === products.length && products.length > 0}
                                />
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                                Produs {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th className="px-4 py-4">Achiziție (Furnizor)</th>
                            <th className="px-4 py-4 cursor-pointer hover:text-gray-900" onClick={() => handleSort('priceB2B')}>
                                Preț Vânzare {sortConfig.key === 'priceB2B' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th className="px-4 py-4 cursor-pointer hover:text-gray-900" onClick={() => handleSort('profitB2B')}>
                                Profit B2B {sortConfig.key === 'profitB2B' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th className="px-4 py-4 cursor-pointer hover:text-gray-900" onClick={() => handleSort('stock')}>
                                Stoc {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th className="px-4 py-4 text-center cursor-pointer hover:text-gray-900" onClick={() => handleSort('status')}>
                                Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th className="px-4 py-4 cursor-pointer hover:text-gray-900" onClick={() => handleSort('priceChanged')}>
                                <span className={`${sortConfig.key === 'priceChanged' ? 'text-amber-600' : ''}`}>
                                    ⚡ Preț {sortConfig.key === 'priceChanged' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th className="px-4 py-4 text-right">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-8 text-gray-500">Se încarcă...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-8 text-gray-500">Niciun produs găsit.</td></tr>
                        ) : products.map((product) => (
                            <React.Fragment key={product.id}>
                            <tr 
                                className={`group hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}
                                onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                            >
                                <td className="px-4 py-4 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="checkbox"
                                        checked={selectedIds.includes(product.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds([...selectedIds, product.id]);
                                            } else {
                                                setSelectedIds(selectedIds.filter(id => id !== product.id));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded border border-gray-100 object-contain bg-white" />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                                <Package className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="font-medium text-gray-900 line-clamp-2 max-w-[250px]" title={product.name}>{product.name}</div>
                                            {product.sku && (
                                                <div className="text-[11px] font-mono text-gray-500 mt-0.5 truncate max-w-[250px]" title={product.sku}>
                                                    SKU: {product.sku}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {product.forceInstallation && (
                                                    <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm border border-purple-200">
                                                        Montaj Obligatoriu
                                                    </span>
                                                )}
                                                {product.syncToWooCommerce && (
                                                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm border border-blue-200" title="Prețul public se adaptează după costul B2B la achiziție">
                                                        Autosync RETAIL
                                                    </span>
                                                )}
                                                {product.isPriceOverridden && (
                                                    <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm border border-orange-200 flex items-center gap-1" title="Prețul este fixat manual și nu variază la modificările furnizorului">
                                                        🔒 PREȚ FIX
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {product.suppliers && product.suppliers.length > 0 ? (
                                        (() => {
                                            const active = product.suppliers.filter(s => s.supplierStock.includes('in_stock'));
                                            if (active.length > 0) {
                                                const lowest = active.reduce((prev, curr) => prev.supplierPrice < curr.supplierPrice ? prev : curr);
                                                return (
                                                    <div>
                                                        <div className="font-bold text-gray-900">{lowest.supplierPrice} RON</div>
                                                        <div className="text-[10px] text-gray-500 bg-gray-100 uppercase px-1.5 py-0.5 rounded inline-block mt-0.5 shadow-sm">{lowest.supplier.name}</div>
                                                    </div>
                                                );
                                            } else {
                                                const lowest = product.suppliers.reduce((prev, curr) => prev.supplierPrice < curr.supplierPrice ? prev : curr);
                                                return <div className="text-gray-400 font-bold">{lowest.supplierPrice} RON <span className="text-[10px] block font-normal">(Lipsă Stoc Furnizor)</span></div>;
                                            }
                                        })()
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Fără Furnizor</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-bold text-blue-600 text-lg">{product.priceB2B} RON</div>
                                    <div className="mt-1 flex flex-col gap-1 items-start">
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-tight">APP B2B</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded italic font-medium max-w-[150px] leading-tight ${product.repricerMeta?.includes('Auto-Matched') ? 'bg-orange-50 text-orange-600 border border-orange-100 shadow-sm' : 'bg-blue-50 text-blue-500'}`} title={product.repricerMeta || `Adaos Standard: ${product.marginValue} ${product.marginType === 'PERCENT' ? '%' : 'RON'}`}>
                                            {product.repricerMeta || `Adaos: ${product.marginValue} ${product.marginType === 'PERCENT' ? '%' : 'RON'}`}
                                        </div>
                                        {product.priceRetail && <div className="text-[11px] text-gray-400 font-mono">Retail: {product.priceRetail} RON</div>}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {product.suppliers && product.suppliers.length > 0 ? (
                                        (() => {
                                            const active = product.suppliers.filter(s => s.supplierStock.includes('in_stock'));
                                            if(active.length > 0) {
                                                 const lowest = active.reduce((prev, curr) => prev.supplierPrice < curr.supplierPrice ? prev : curr);
                                                 const profit = product.priceB2B - lowest.supplierPrice;
                                                 return (
                                                    <div className={`font-bold ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {profit > 0 ? '+' : ''}{profit.toFixed(2)} RON
                                                    </div>
                                                 );
                                            }
                                            return <span className="text-gray-400">-</span>;
                                        })()
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    {(() => {
                                        const hasStock = (product.suppliers && product.suppliers.length > 0)
                                            ? product.computedStockStatus === 'in_stock'
                                            : product.stock > 0;
                                            
                                        return <span className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded shadow-sm border uppercase ${hasStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{hasStock ? 'ÎN STOC' : 'LIPSĂ STOC'}</span>;
                                    })()}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <button
                                        onClick={() => toggleStatus(product.id, product.active)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${product.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {product.active ? 'Activ' : 'Inactiv'}
                                    </button>
                                </td>
                                <td className="px-4 py-4">
                                    {product.latestPriceChange ? (
                                        (() => {
                                            const changed = new Date(product.latestPriceChange);
                                            const now = new Date();
                                            const hoursAgo = Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60));
                                            const isRecent = hoursAgo < 24;
                                            return (
                                                <div className="flex flex-col items-start gap-1">
                                                    {isRecent && (
                                                        <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm border border-amber-200 animate-pulse">
                                                            ⚡ Actualizat
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] ${isRecent ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                                                        {hoursAgo < 1 ? 'Acum' : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo / 24)}z`}
                                                    </span>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <span className="text-gray-300 text-[10px]">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                        title="Modifică Preț / Configurație"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                            {/* CORTINA PENTRU FURNIZORI */}
                            {expandedProductId === product.id && (
                                <tr className="bg-slate-50 border-b border-gray-100 shadow-inner">
                                    <td colSpan={7} className="px-12 py-4">
                                        {product.suppliers && product.suppliers.length > 0 ? (
                                            <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {product.suppliers.map((sup, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block uppercase tracking-wider">{sup.supplier.name}</span>
                                                            <a href={sup.supplierProductUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[10px] font-semibold bg-blue-50 px-2 py-1 rounded">Vezi pe site 🔗</a>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                                                            <div>
                                                                <div className="text-[10px] text-gray-400 font-bold uppercase">Preț Extractor</div>
                                                                <div className="text-sm font-bold text-gray-800">{sup.supplierPrice} RON</div>
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${sup.supplierStock.includes('in') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {sup.supplierStock.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                <h4 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Istoric Prețuri (Evoluție Achiziție B2B)</h4>
                                                <PriceHistoryChart productId={product.id} />
                                            </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-4 text-center">Acest produs B2B nu este asociat cu niciun produs din surse externe în acest moment.</div>
                                        )}
                                    </td>
                                </tr>
                            )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                
                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Pagina <span className="font-semibold text-gray-900">{page}</span> din <span className="font-semibold text-gray-900">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterioara
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Următoarea
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-Over Panel Editare Configurație */}
            {editingProduct && (
                <div className="fixed inset-0 z-[100] flex justify-end items-stretch">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setEditingProduct(null)}></div>
                    
                    {/* Panel Content (Side Panel Slide-In) */}
                    <div className="bg-white w-full max-w-md h-full shadow-2xl relative animate-in slide-in-from-right duration-300 flex flex-col z-10 border-l border-gray-200">
                        
                        {/* Header Fix */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-blue-600" />
                                Editează Setări E-Shop
                            </h3>
                            <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-200 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Form Content (Scrollable) */}
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">{editingProduct.name}</h4>
                                <p className="text-xs font-mono text-gray-500">SKU: {editingProduct.sku || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preț Instalator (B2B)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={editPriceB2B} 
                                            onChange={e => setEditPriceB2B(parseFloat(e.target.value) || 0)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-bold"
                                        />
                                        <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">RON</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preț Client Final</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={editPriceRetail || ''} 
                                            onChange={e => setEditPriceRetail(parseFloat(e.target.value) || null)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">RON</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adaos Comercial Sourcing</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={editMarginValue} 
                                                onChange={e => setEditMarginValue(parseFloat(e.target.value) || 0)}
                                                disabled={editIsOverridden}
                                                className={`w-full border rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 ${editIsOverridden ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-900 border-gray-300'}`}
                                            />
                                        </div>
                                        <select
                                            className="w-24 border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                            value={editMarginType}
                                            onChange={e => setEditMarginType(e.target.value)}
                                            disabled={editIsOverridden}
                                        >
                                            <option value="PERCENT">%</option>
                                            <option value="FIXED">RON</option>
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Acest adaos se aplică peste cel mai ieftin cost de achiziție găsit automat.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Categorii WooCommerce</label>
                                    <div className="w-full border border-gray-300 rounded-lg bg-gray-50 flex flex-col max-h-48 overflow-y-auto">
                                        {wooCategories.length === 0 && <div className="p-4 text-xs text-center text-gray-500">Se încarcă categoriile...</div>}
                                        {wooCategories.map(c => (
                                            <label key={c.databaseId} className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white hover:bg-blue-50 cursor-pointer transition-colors m-0">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                                    checked={editWooCategoryIds.includes(c.databaseId)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setEditWooCategoryIds([...editWooCategoryIds, c.databaseId]);
                                                        else setEditWooCategoryIds(editWooCategoryIds.filter(id => id !== c.databaseId));
                                                    }}
                                                />
                                                <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                                <span className="ml-auto text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">ID: {c.databaseId}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Produsul va fi publicat în magazin în toate categoriile bifate.</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-0">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editSyncWoo}
                                        onChange={e => setEditSyncWoo(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <div>
                                        <p className="font-bold text-blue-900 text-sm">Sincronizează Prețul și Stocul în WooCommerce</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Dacă bifezi, prețul B2B/Retail generat de acest panou (și verificat de Hub zilnic) se va suprascrie automat în WordPress Live.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mt-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editIsOverridden}
                                        onChange={e => setEditIsOverridden(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <div>
                                        <p className="font-bold text-orange-900 text-sm">Decuplează Prețul de la Sincronizare</p>
                                        <p className="text-xs text-orange-700 mt-1">
                                            Dacă bifezi, prețul afișat mai sus va deveni fix în aplicația B2B și nu va mai putea fi suprascris automat de prețul din WooCommerce.
                                        </p>
                                    </div>
                                </label>
                            </div>
                            
                            {/* NEW SECTION: Furnizori Asociați */}
                            <div className="mt-6 border-t border-gray-100 pt-5">
                                <h4 className="font-bold text-gray-800 text-sm mb-3">Furnizori Asociați (Scraper)</h4>
                                <div className="space-y-2">
                                    {!editingProduct.suppliers || editingProduct.suppliers.length === 0 ? (
                                        <div className="bg-gray-50 border border-dashed border-gray-200 p-3 rounded-lg text-center">
                                            <p className="text-xs text-gray-500 italic">Niciun furnizor asociat curent.</p>
                                        </div>
                                    ) : (
                                        editingProduct.suppliers.map((sup, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-lg hover:border-blue-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 shadow-sm text-[10px] font-bold text-blue-900">
                                                        {sup.supplier.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 leading-none">{sup.supplier.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-1">Cost curent: {sup.supplierPrice} RON</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded shadow-sm ${sup.supplierStock.includes('in') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                        {sup.supplierStock.includes('in') ? 'ÎN STOC' : 'INDISPONIBIL'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Fix (Sticky Actions) */}
                        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={() => setEditingProduct(null)}
                                className="px-4 py-2 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Anulare
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? 'Se Salvează...' : 'Salvează Modificările'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Componenta de Grafic Istoric Prețuri ---
function PriceHistoryChart({ productId }: { productId: number }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/b2b-products/${productId}/history`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setHistory(data.history);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [productId]);

    if (loading) return <div className="text-xs text-gray-400 py-4 text-center">Se încarcă istoricul de preț...</div>;
    
    if (history.length === 0) {
        return <div className="text-xs text-gray-400 py-4 text-center">Nu există modificări de preț înregistrate pentru acest produs. El are prețul inițial de mapare.</div>;
    }

    // Grouping logic for recharts: we want 'date' on X, and line for each supplier on Y
    const groupedData: any[] = [];
    const dates = Array.from(new Set(history.map(h => h.date))).sort((a: any, b: any) => {
        if (a === 'T0 (Inițial)') return -1;
        if (b === 'T0 (Inițial)') return 1;
        return a.localeCompare(b);
    });
    const suppliers = Array.from(new Set(history.map(h => h.supplierName)));

    dates.forEach(date => {
        const pointData: any = { date };
        suppliers.forEach(supp => {
            const entry = history.find(h => h.date === date && h.supplierName === supp);
            if (entry) {
                pointData[supp] = entry.newPrice;
            }
        });
        groupedData.push(pointData);
    });

    const colors = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#db2777'];

    return (
        <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={groupedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    {suppliers.map((supp, idx) => (
                        <Line key={supp} type="monotone" dataKey={supp} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={true} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
