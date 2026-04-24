'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, Mail, Package, Link as LinkIcon, XCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Supplier {
    id: number;
    name: string;
    cui: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    websiteUrl?: string;
    crawlerConfig?: any;
    active: boolean;
    autoSync?: boolean;
    supplierRole?: string;
    competitorUndercut?: number;
    defaultMarginValue?: number | null;
    defaultMarginType?: string | null;
    _count?: { products: number, unmapped: number };
    scraperJobs?: any[];
}

interface Product {
    id: number;
    name: string;
    price: number;
    image: string | null;
    suppliers?: { supplierId: number, price: number }[];
}

export default function SuppliersPage() {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [scrapingJobs, setScrapingJobs] = useState<Record<number, { id: number, status: string, progress: string | null }>>({});
    const [globalCronEnabled, setGlobalCronEnabled] = useState(false);
    const [globalCronTime, setGlobalCronTime] = useState('04:00');
    const [globalCronFrequency, setGlobalCronFrequency] = useState('24');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: '', cui: '', contact: '', phone: '', email: '', address: '', websiteUrl: '', active: true, crawlerConfig: {} as any, defaultMarginValue: 10 as number | null, defaultMarginType: 'PERCENT', supplierRole: 'CORE', competitorUndercut: 0.50
    });

    // Scraper Modal State
    const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);
    const [scraperData, setScraperData] = useState({
        catalogUrls: '', productLinkSelector: '', paginationSelector: '', priceSelector: '', titleSelector: '', stockSelector: '',
        customProvider: '', regionalStockLocation: ''
    });

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Using a map to track input prices for each product in the list
    const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});

    useEffect(() => {
        fetchSuppliers();
        fetchGlobalCron();
    }, []);

    const fetchGlobalCron = async () => {
        try {
            const res = await fetch('/api/admin/settings/cron');
            const data = await res.json();
            if (data.success) {
                setGlobalCronEnabled(data.enabled);
                if (data.cronTime) setGlobalCronTime(data.cronTime);
                if (data.cronFrequency) setGlobalCronFrequency(data.cronFrequency.toString());
            }
        } catch (e) { console.error(e); }
    };

    const toggleGlobalCron = async () => {
        try {
            const res = await fetch('/api/admin/settings/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !globalCronEnabled })
            });
            const data = await res.json();
            if (data.success) {
                setGlobalCronEnabled(data.enabled);
                showToast(data.enabled ? "Cron Scraper a fost PORNIT!" : "Cron Scraper a fost OPRIT complet!", "success");
            }
        } catch (e) { showToast("Eroare comunicare.", "error"); }
    };

    const handleUpdateCronSettings = async (field: string, value: string) => {
        try {
            const payload = field === 'time' ? { cronTime: value } : { cronFrequency: value };
            const res = await fetch('/api/admin/settings/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Setare Cron salvată automat.", "success");
            }
        } catch (e) { showToast("Eroare salvare Setare Cron", "error"); }
    };

    const toggleSupplierAutoSync = async (id: number, current: boolean) => {
        try {
            const res = await fetch(`/api/admin/suppliers/${id}/auto-sync`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoSync: !current })
            });
            if (res.ok) {
                setSuppliers(suppliers.map(s => s.id === id ? { ...s, autoSync: !current } : s));
            }
        } catch (e) { showToast("Eroare salvare status auto-sync", "error"); }
    };

    // Polling Effect pentru Extrage status live de la Joburile Scraper
    useEffect(() => {
        const activeSuppliers = Object.keys(scrapingJobs).map(Number).filter(suppId => {
            const job = scrapingJobs[suppId];
            return job && job.status === 'running';
        });

        if (activeSuppliers.length === 0) return;

        const interval = setInterval(async () => {
             for (const suppId of activeSuppliers) {
                 const jobId = scrapingJobs[suppId].id;
                 try {
                     const res = await fetch(`/api/admin/scrapers/status?jobId=${jobId}`);
                     if (!res.ok) continue;
                     const data = await res.json();
                     if (data.success && data.job) {
                         const currentProgress = data.job.progress;
                         const currentStatus = data.job.status;

                         setScrapingJobs(prev => {
                             const prevJob = prev[suppId];
                             if (prevJob?.status === currentStatus && prevJob?.progress === currentProgress) {
                                  return prev; // Săbiere stadii repetate (evitare re-render)
                             }
                             return {
                                 ...prev,
                                 [suppId]: { id: data.job.id, status: data.job.status, progress: data.job.progress }
                             };
                         });

                         if (currentStatus === 'completed' || currentStatus === 'error') {
                             if (currentStatus === 'completed') {
                                 const stats = data.job.resultStats || { total: 0, autoMapped: 0, unmapped: 0 };
                                 showToast(`Scraping complet (${data.job.supplier?.name || ''})! Găsite: ${stats.total} | Alocate Auto: ${stats.autoMapped} | Carantină: ${stats.unmapped}`, "success");
                                 fetchSuppliers(); // Refresh list stats
                             } else {
                                 showToast(`Eroare Scraper: ${data.job.errorLog || 'Eroare necunoscută'}`, "error");
                             }
                         }
                     }
                 } catch (e) {
                     console.error("Polling error", e);
                 }
             }
        }, 3000);

        return () => clearInterval(interval);
    }, [scrapingJobs, showToast]);

    // Search Debounce for Products
    useEffect(() => {
        if (!isProductModalOpen) return;

        const timeout = setTimeout(() => {
            fetchProducts();
        }, 500);

        return () => clearTimeout(timeout);
    }, [productSearch, isProductModalOpen]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/suppliers?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setSuppliers(data.suppliers);
            } else {
                showToast("Nu s-au putut încărca furnizorii.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Eroare de conexiune.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch(`/api/dispatch/products?search=${productSearch}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name, cui: supplier.cui || '', contact: supplier.contact || '', 
                phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '', 
                websiteUrl: supplier.websiteUrl || '', active: supplier.active, crawlerConfig: supplier.crawlerConfig || {},
                defaultMarginValue: supplier.defaultMarginValue || 10, defaultMarginType: supplier.defaultMarginType || 'PERCENT',
                supplierRole: supplier.supplierRole || 'CORE', competitorUndercut: supplier.competitorUndercut ?? 0.50
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '', cui: '', contact: '', phone: '', email: '', address: '', websiteUrl: '', active: true, crawlerConfig: {}, defaultMarginValue: 10, defaultMarginType: 'PERCENT', supplierRole: 'CORE', competitorUndercut: 0.50
            });
        }
        setIsModalOpen(true);
    };

    const openScraperModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        const cfg = supplier.crawlerConfig as any;
        setScraperData({
            catalogUrls: cfg?.catalogUrls?.join('\n') || '',
            productLinkSelector: cfg?.productLinkSelector || '',
            paginationSelector: cfg?.paginationSelector || '',
            priceSelector: cfg?.priceSelector || '',
            titleSelector: cfg?.titleSelector || '',
            stockSelector: cfg?.stockSelector || '',
            customProvider: cfg?.customProvider || '',
            regionalStockLocation: cfg?.regionalStockLocation || ''
        });
        setIsScraperModalOpen(true);
    };

    const handleRunScraper = async (supplierId: number) => {
        setScrapingJobs(prev => ({ ...prev, [supplierId]: { id: 0, status: 'starting', progress: 'Se pornește jobul...' } }));

        try {
            const res = await fetch('/api/admin/scrapers/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplierId })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast("Browser Scraper inițializat cu succes. Va dura câteva minute...", "info");
                // Înregistrăm ID-ul ca să înceapă polling-ul
                setScrapingJobs(prev => ({ 
                    ...prev, 
                    [supplierId]: { id: data.jobId, status: 'running', progress: 'Conectare la server...' } 
                }));
            } else {
                showToast(data.message || "Eroare la pornirea Scraper-ului.", "error");
                setScrapingJobs(prev => { const n = {...prev}; delete n[supplierId]; return n; });
            }
        } catch (error) {
            showToast("Eroare neașteptată de rețea.", "error");
            setScrapingJobs(prev => { const n = {...prev}; delete n[supplierId]; return n; });
        }
    };

    const handleSaveScraper = async () => {
        if (!editingSupplier) return;
        
        const newCfg = {
            ...editingSupplier.crawlerConfig,
            catalogUrls: scraperData.catalogUrls.split('\n').map(u => u.trim()).filter(Boolean),
            productLinkSelector: scraperData.productLinkSelector,
            paginationSelector: scraperData.paginationSelector,
            priceSelector: scraperData.priceSelector,
            titleSelector: scraperData.titleSelector,
            stockSelector: scraperData.stockSelector,
            customProvider: scraperData.customProvider || null,
            regionalStockLocation: scraperData.regionalStockLocation || null
        };

        try {
            const res = await fetch(`/api/admin/suppliers/${editingSupplier.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingSupplier, crawlerConfig: newCfg })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Configurare Scraper salvată!", "success");
                setIsScraperModalOpen(false);
                fetchSuppliers();
            } else {
                showToast(data.message || "Eroare la salvare.", "error");
            }
        } catch (e) {
            showToast("Eroare neașteptată.", "error");
        }
    };

    const handleOpenProductModal = (supplier: Supplier) => {
        setCurrentSupplier(supplier);
        setProductSearch('');
        setPriceInputs({});
        setIsProductModalOpen(true);
        // Will trigger fetchProducts via effect
    };

    const handleProductLink = async (product: Product, action: 'link' | 'unlink') => {
        if (!currentSupplier) return;

        const price = priceInputs[product.id] || product.price.toString();

        try {
            const res = await fetch('/api/admin/supplier-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    supplierId: currentSupplier.id,
                    action,
                    price
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast(action === 'link' ? "Produs asociat!" : "Asociere ștearsă!", "success");
                fetchProducts(); // Refresh list to update UI state
            } else {
                showToast(data.message || "Eroare.", "error");
            }
        } catch (error) {
            showToast("Eroare de conexiune.", "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const method = editingSupplier ? 'PUT' : 'POST';
        const url = editingSupplier
            ? `/api/admin/suppliers/${editingSupplier.id}`
            : '/api/admin/suppliers';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                showToast(editingSupplier ? "Furnizor actualizat!" : "Furnizor adăugat!", "success");
                setIsModalOpen(false);
                fetchSuppliers();
            } else {
                showToast(data.message || "Eroare la salvare.", "error");
            }
        } catch (error) {
            showToast("Eroare neașteptată.", "error");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Sigur doriți să ștergeți acest furnizor?')) return;

        try {
            const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Furnizor șters.", "info");
                fetchSuppliers();
            } else {
                showToast("Eroare la ștergere.", "error");
            }
        } catch (error) {
            showToast("Eroare neașteptată.", "error");
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cui?.includes(searchTerm)
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestionare Furnizori</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Adaugă Furnizor
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Caută după nume sau CUI..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2 ml-auto p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3 w-full justify-between">
                        <span className="text-sm font-semibold text-gray-700">Comutator Global Cron (BOT 24/7):</span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleGlobalCron}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${globalCronEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalCronEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-xs font-bold ${globalCronEnabled ? 'text-green-600' : 'text-gray-400'} w-14 text-right`}>
                                {globalCronEnabled ? 'ACTIVAT' : 'OPRIT'}
                            </span>
                        </div>
                    </div>
                    {globalCronEnabled && (
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200 w-full animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col text-xs space-y-1">
                                <label className="font-medium text-gray-600">Ora plecare referință:</label>
                                <input 
                                    type="time" 
                                    value={globalCronTime} 
                                    className="border rounded p-1 text-sm font-mono focus:ring-blue-500"
                                    onChange={(e) => {
                                        setGlobalCronTime(e.target.value);
                                        handleUpdateCronSettings('time', e.target.value);
                                    }}
                                />
                            </div>
                            <div className="flex flex-col text-xs space-y-1">
                                <label className="font-medium text-gray-600">Frecvență de Rulare:</label>
                                <select 
                                    className="border rounded p-1 text-sm bg-white focus:ring-blue-500"
                                    value={globalCronFrequency}
                                    onChange={(e) => {
                                        setGlobalCronFrequency(e.target.value);
                                        handleUpdateCronSettings('freq', e.target.value);
                                    }}
                                >
                                    <option value="24">Zilnic (1 pe zi)</option>
                                    <option value="12">La fiecare 12 ore</option>
                                    <option value="6">La fiecare 6 ore</option>
                                    <option value="3">La fiecare 3 ore</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Companie / CUI</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Detalii</th>
                            <th className="px-6 py-4">Status & Web</th>
                            <th className="px-6 py-4">Bază de Date</th>
                            <th className="px-6 py-4 text-right">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Se încarcă...</td></tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Niciun furnizor găsit.</td></tr>
                        ) : filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{supplier.name}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">{supplier.cui || '-'}</div>
                                    {(scrapingJobs[supplier.id]?.status === 'running' || scrapingJobs[supplier.id]?.status === 'starting') && (
                                        <div className="mt-2 text-[10px] font-medium text-blue-600 bg-blue-50 py-1.5 px-2 rounded flex items-center gap-1.5 animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {scrapingJobs[supplier.id]?.progress || 'Se inițializează botul...'}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {supplier.contact ? (
                                        <div className="flex items-center">
                                            <span className="font-medium">{supplier.contact}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 space-y-1">
                                    {supplier.phone && (
                                        <div className="flex items-center text-xs">
                                            <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center text-xs">
                                            <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                                            {supplier.email}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        {supplier.active ? (
                                            <span className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activ</span>
                                        ) : (
                                            <span className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactiv</span>
                                        )}
                                        <span className={`w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${supplier.supplierRole === 'COMPETITOR' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {supplier.supplierRole === 'COMPETITOR' ? `🔴 CONCURENT (-${supplier.competitorUndercut} RON)` : '🟢 BAZĂ'}
                                        </span>
                                        {supplier.websiteUrl && (
                                            <a href={supplier.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                                                <LinkIcon className="w-3 h-3 mr-1" /> Website
                                            </a>
                                        )}
                                        <div className="mt-2 flex items-center gap-1.5 cursor-pointer" onClick={() => toggleSupplierAutoSync(supplier.id, !!supplier.autoSync)}>
                                            <span className="text-xs text-gray-500 font-medium">B2B Auto-Sync:</span>
                                            <div className={`w-3 h-3 rounded-full border ${supplier.autoSync ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-300'}`}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-xs">
                                        <span className="text-gray-600">Produse Mapate: <b className="text-gray-900">{supplier._count?.products || 0}</b></span>
                                        <span className="text-red-600 font-medium">Carantină: <b className="text-red-700">{supplier._count?.unmapped || 0}</b></span>
                                        {supplier.scraperJobs && supplier.scraperJobs.length > 0 && (
                                            <span className="text-gray-500 mt-1 italic" title="Data ultimei treceri a robotului de achiziție">
                                                Ultima verificare: <b>{new Date(supplier.scraperJobs[0].updatedAt).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</b>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                    <button
                                        onClick={() => handleRunScraper(supplier.id)}
                                        disabled={scrapingJobs[supplier.id]?.status === 'running' || scrapingJobs[supplier.id]?.status === 'starting'}
                                        className={`p-1.5 rounded-md transition-colors ${scrapingJobs[supplier.id]?.status === 'running' || scrapingJobs[supplier.id]?.status === 'starting' ? 'bg-gray-100 text-gray-400' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                        title="Lansează Bot Scraper pe Site"
                                    >
                                        {scrapingJobs[supplier.id]?.status === 'running' || scrapingJobs[supplier.id]?.status === 'starting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
                                    </button>
                                    <button
                                            onClick={() => openScraperModal(supplier)}
                                            className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors w-full sm:w-auto"
                                        title="Configurare Boți"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
                                    </button>
                                    <button
                                        onClick={() => { window.location.href = `/admin/furnizori/carantina?supplierId=${supplier.id}`; }}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                        title="Carantină & Asocieri (Scraper V2)"
                                    >
                                        <Package className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(supplier)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Editează"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Șterge"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Supplier Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* ... (Same as before) ... */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingSupplier ? 'Editează Furnizor' : 'Adaugă Furnizor Nou'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nume Companie <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CUI</label>
                                    <input
                                        type="text"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        value={formData.cui}
                                        onChange={e => setFormData({ ...formData, cui: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Persoană Contact</label>
                                    <input
                                        type="text"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefon</label>
                                    <input
                                        type="tel"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresă Sediu</label>
                                <textarea
                                    rows={2}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website URL (Catalog Sursă)</label>
                                <input
                                    type="url"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                    placeholder="https://romstal.ro/categorie"
                                    value={formData.websiteUrl}
                                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Adaos Default (B2B)</label>
                                    <input
                                        type="number"
                                        className="w-full border-blue-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        placeholder="Ex: 10, -5"
                                        value={formData.defaultMarginValue || ''}
                                        onChange={e => setFormData({ ...formData, defaultMarginValue: e.target.value ? parseFloat(e.target.value) : null })}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Tip Adaos</label>
                                    <select
                                        className="w-full border-blue-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
                                        value={formData.defaultMarginType || 'PERCENT'}
                                        onChange={e => setFormData({ ...formData, defaultMarginType: e.target.value })}
                                    >
                                        <option value="PERCENT">%</option>
                                        <option value="FIXED">RON</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 p-3 bg-purple-50 border border-purple-100 rounded-lg mt-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Tip Monitorizare</label>
                                    <select
                                        className="w-full border-purple-200 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2 text-sm text-purple-900 font-medium"
                                        value={formData.supplierRole || 'CORE'}
                                        onChange={e => setFormData({ ...formData, supplierRole: e.target.value })}
                                    >
                                        <option value="CORE">🟢 Furnizor Principal (Adugăm Profil Profit)</option>
                                        <option value="COMPETITOR">🔴 Concurent Retail (Spionaj Preț / Target)</option>
                                    </select>
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Undercut (RON)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        disabled={formData.supplierRole !== 'COMPETITOR'}
                                        className="w-full border-purple-200 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2 text-sm disabled:opacity-50"
                                        placeholder="0.5"
                                        value={formData.competitorUndercut ?? ''}
                                        onChange={e => setFormData({ ...formData, competitorUndercut: e.target.value ? parseFloat(e.target.value) : 0 })}
                                        title="Daca este setat, va bate concurenta cu aceasta valoare (ex: 0.5 Lei in minus fata de ei)"
                                    />
                                </div>
                            </div>


                            <div className="flex items-center pt-2">
                                <input
                                    id="active"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                />
                                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                                    Furnizor Activ
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm"
                                >
                                    Anulează
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm shadow-sm"
                                >
                                    Salvează
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Scraper Config Modal */}
            {isScraperModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                            <h2 className="text-lg font-bold text-orange-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
                                Configurare Boți Scraper (DOM Selectors)
                            </h2>
                            <button onClick={() => setIsScraperModalOpen(false)} className="text-orange-400 hover:text-orange-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-2">
                                Aceste reguli CSS dictează cum navighează boții pe site-ul <b>{editingSupplier?.name}</b> pentru a importa produse automat.
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL-uri Categorie (Câte unul pe rând)</label>
                                <textarea
                                    rows={3}
                                    placeholder="https://website.ro/aer-conditionat&#10;https://website.ro/pompe-caldura"
                                    className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                    value={scraperData.catalogUrls}
                                    onChange={e => setScraperData({ ...scraperData, catalogUrls: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-6">
                                <h3 className="font-bold text-gray-700 text-sm mb-4">Mod Avansat (Regional / Hibrid)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Furnizor Custom (API Intercept)</label>
                                        <input
                                            type="text"
                                            placeholder="ex: altex"
                                            className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                            value={scraperData.customProvider || ''}
                                            onChange={e => setScraperData({ ...scraperData, customProvider: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Lăsați gol pentru scraper standard DOM.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Locație Regională (Oraș/Județ)</label>
                                        <input
                                            type="text"
                                            placeholder="ex: Bucuresti sau Alba"
                                            className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                            value={scraperData.regionalStockLocation || ''}
                                            onChange={e => setScraperData({ ...scraperData, regionalStockLocation: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Unde caută robotul stoc fizic dacă e OUT_OF_STOCK central.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-6">
                                <h3 className="font-bold text-gray-700 text-sm mb-4">Selectori Pagină Categorie (Listă)</h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selector Link Produs</label>
                                    <input
                                        type="text"
                                        placeholder=".product-item a.title"
                                        className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                        value={scraperData.productLinkSelector}
                                        onChange={e => setScraperData({ ...scraperData, productLinkSelector: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selector Paginare (Următoarea)</label>
                                    <input
                                        type="text"
                                        placeholder="a.next-page"
                                        className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                        value={scraperData.paginationSelector}
                                        onChange={e => setScraperData({ ...scraperData, paginationSelector: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-6">
                                <h3 className="font-bold text-gray-700 text-sm mb-4">Selectori Pagină Produs (Single Page)</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preț</label>
                                        <input
                                            type="text"
                                            placeholder=".price .amount"
                                            className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                            value={scraperData.priceSelector}
                                            onChange={e => setScraperData({ ...scraperData, priceSelector: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titlu / Nume</label>
                                        <input
                                            type="text"
                                            placeholder="h1.product-title"
                                            className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                            value={scraperData.titleSelector}
                                            onChange={e => setScraperData({ ...scraperData, titleSelector: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Badge Stoc</label>
                                        <input
                                            type="text"
                                            placeholder=".stock-status.in-stock"
                                            className="w-full font-mono text-sm border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2"
                                            value={scraperData.stockSelector}
                                            onChange={e => setScraperData({ ...scraperData, stockSelector: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsScraperModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleSaveScraper}
                                className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-medium text-sm shadow-sm"
                            >
                                Salvează Reguli Crawler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT MANAGER MODAL */}
            {isProductModalOpen && currentSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Asociază Produse</h2>
                                <p className="text-sm text-gray-500">pentru <span className="font-semibold text-blue-600">{currentSupplier.name}</span></p>
                            </div>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Caută produse WooCommerce..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {loadingProducts ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p>Se caută produse...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Niciun produs găsit.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {products.map(product => {
                                        const isLinked = product.suppliers?.some(s => s.supplierId === currentSupplier.id);
                                        const linkedData = product.suppliers?.find(s => s.supplierId === currentSupplier.id);

                                        return (
                                            <div key={product.id} className={`bg-white p-3 rounded-lg border ${isLinked ? 'border-green-300 bg-green-50/30' : 'border-gray-200'} shadow-sm flex items-center gap-4`}>
                                                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                                    {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-gray-900 truncate" title={product.name}>{product.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">Preț Vânzare: <span className="font-medium text-gray-700">{product.price} Lei</span></span>
                                                        {isLinked && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200">ASOCIAT</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end">
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Preț Achiziție</label>
                                                        <input
                                                            type="number"
                                                            className="w-24 text-right text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 outline-none"
                                                            placeholder={linkedData ? linkedData.price.toString() : product.price.toString()}
                                                            value={priceInputs[product.id] !== undefined ? priceInputs[product.id] : (linkedData ? linkedData.price : '')}
                                                            onChange={(e) => setPriceInputs({ ...priceInputs, [product.id]: e.target.value })}
                                                        />
                                                    </div>

                                                    {isLinked ? (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleProductLink(product, 'link')}
                                                                className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                title="Actualizează Preț"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleProductLink(product, 'unlink')}
                                                                className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                title="Șterge Asociere"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleProductLink(product, 'link')}
                                                            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded hover:bg-black transition-colors flex items-center"
                                                        >
                                                            <LinkIcon className="w-3 h-3 mr-1.5" />
                                                            Leagă
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
