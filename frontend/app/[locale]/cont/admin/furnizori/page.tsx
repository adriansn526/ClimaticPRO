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
    active: boolean;
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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        cui: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        active: true
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
    }, []);

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
            const res = await fetch('/api/admin/suppliers');
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
            // Fetch B2B products (includes supplier data)
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
                name: supplier.name,
                cui: supplier.cui || '',
                contact: supplier.contact || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                active: supplier.active
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                cui: '',
                contact: '',
                phone: '',
                email: '',
                address: '',
                active: true
            });
        }
        setIsModalOpen(true);
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
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Companie / CUI</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Detalii</th>
                            <th className="px-6 py-4">Status</th>
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
                                    {supplier.active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Activ
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Inactiv
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                    <button
                                        onClick={() => handleOpenProductModal(supplier)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                        title="Gestionează Produse"
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
