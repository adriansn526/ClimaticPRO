'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Trash2, Link as LinkIcon } from 'lucide-react';

export default function SupplierCategoriesPage() {
    const { showToast } = useToast();
    const [mappings, setMappings] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [b2bCategories, setB2B] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ supplierId: '', supplierNameStr: '', internalId: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const resM = await fetch('/api/admin/suppliers/categories');
            const dataM = await resM.json();
            if (dataM.success) setMappings(dataM.data);

            const resS = await fetch('/api/admin/suppliers');
            const dataS = await resS.json();
            if (dataS.success) setSuppliers(dataS.data);

            // Fetch generic b2b categories (We can use b2b-products endpoint or create a simple one. We'll reuse logic or fetch from a dedicated route)
            // Wait, we need a standard category fetch. Let's just create /api/admin/categories and fetch.
            const resC = await fetch('/api/admin/b2b-products/categories'); // If exists, otherwise we'll just implement it
            const dataC = await resC.json();
            if (dataC.success) setB2B(dataC.categories || dataC.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/suppliers/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: form.supplierId,
                    supplierCategoryName: form.supplierNameStr,
                    internalCategoryId: form.internalId
                })
            });
            const d = await res.json();
            if (d.success) {
                showToast(d.message, 'success');
                setForm({ supplierId: '', supplierNameStr: '', internalId: '' });
                fetchData();
            } else {
                showToast(d.message, 'error');
            }
        } catch(e) {
            showToast('Eroare la salvare', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800">Dicționar Categorii B2B</h1>
            <p className="text-gray-500">Mapează denumirile de categorii găsite la furnizori (ex: "Climatizare") către categoriile tale standard (ex: "Aere Condiționate"). Bot-ul va aplica automat aceste legături la viitoarele importuri.</p>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Adaugă Regulă Nouă</h3>
                <form onSubmit={handleSave} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Furnizor (Sursa)</label>
                        <select required className="w-full border p-2 rounded" value={form.supplierId} onChange={(e)=>setForm({...form, supplierId: e.target.value})}>
                            <option value="">Alege Furnizor...</option>
                            {suppliers.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cuvânt găsit pe site-ul lor</label>
                        <input required type="text" placeholder="ex: Scule și Feronerie" className="w-full border p-2 rounded" value={form.supplierNameStr} onChange={(e)=>setForm({...form, supplierNameStr: e.target.value})} />
                    </div>
                    <div className="px-2 pb-2 text-gray-400">
                        <LinkIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Categoria Ta destinație</label>
                        <select required className="w-full border p-2 rounded bg-purple-50 focus:ring-purple-500" value={form.internalId} onChange={(e)=>setForm({...form, internalId: e.target.value})}>
                            <option value="">Alege din Catalogul Tău...</option>
                            {b2bCategories.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded">Memorează</button>
                    </div>
                </form>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mt-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="p-4">Furnizor Extracție</th>
                            <th className="p-4">Termen Găsit (Breadcrumb)</th>
                            <th className="p-4">Mapat Către (Internal)</th>
                            <th className="p-4 text-right">Acțiune</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading && <tr><td colSpan={4} className="p-4 text-center">Încărcare...</td></tr>}
                        {!loading && mappings.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nicio regulă definită. Adaugă una mai sus!</td></tr>}
                        {mappings.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold">{m.supplier.name}</td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">{m.supplierCategoryName}</span></td>
                                <td className="p-4"><span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded border border-purple-200">{m.category.name}</span></td>
                                <td className="p-4 text-right"><button className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
