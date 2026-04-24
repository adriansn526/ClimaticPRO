'use client';

import { useState, useEffect } from 'react';
import { Truck, Check, X, ShieldAlert, Plus, Trash2, Edit2, DownloadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LogisticsAdminPage() {
    const { isAdmin } = useAuth();
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModaling, setIsModaling] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);

    const [formData, setFormData] = useState({
        countyCode: '',
        standardShippingFee: 120,
        hasLocalInstallers: false,
        waiveShippingIfInstalled: false,
        active: true
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/logistics');
            const data = await res.json();
            if (data.success) {
                setRules(data.rules || []);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const openCreate = () => {
        setEditingRule(null);
        setFormData({
            countyCode: '',
            standardShippingFee: 120,
            hasLocalInstallers: false,
            waiveShippingIfInstalled: false,
            active: true
        });
        setIsModaling(true);
    };

    const openEdit = (rule: any) => {
        setEditingRule(rule);
        setFormData({
            countyCode: rule.countyCode,
            standardShippingFee: rule.standardShippingFee,
            hasLocalInstallers: rule.hasLocalInstallers,
            waiveShippingIfInstalled: rule.waiveShippingIfInstalled,
            active: rule.active
        });
        setIsModaling(true);
    };

    const saveRule = async () => {
        try {
            const url = '/api/admin/logistics';
            const method = editingRule ? 'PUT' : 'POST';
            const body = editingRule ? { ...formData, id: editingRule.id } : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setIsModaling(false);
                fetchRules();
            } else {
                alert('Eroare: ' + data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('Ești sigur că vrei să ștergi această regulă?')) return;
        try {
            const res = await fetch(`/api/admin/logistics?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRules();
            }
        } catch(e) {}
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-blue-600" />
                                Matrice Logistică & Zone Livrare
                            </h1>
                            <p className="text-gray-600 mt-1">Configureză tarifarea transportului și politica referitoare la montaj.</p>
                        </div>
                        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Adaugă Regiune Limitată
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 relative">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Județ / Regiune
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Preț Bază Transport
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Echipe Montaj
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Gratuit La Montaj
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acțiuni
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">Se încarcă...</td></tr>
                                    ) : rules.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nu există zone restricționate. Se va aplica tariful standard pe întreg teritoriul.</td></tr>
                                    ) : rules.map(r => (
                                        <tr key={r.id} className="hover:bg-blue-50/50 transition">
                                            <td className="px-6 py-4 font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500">
                                                {r.countyCode}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600 font-medium">
                                                    {r.standardShippingFee} Lei
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.hasLocalInstallers ? (
                                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        <Check className="w-3 h-3" /> Echipe Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        <X className="w-3 h-3" /> Fără Acoperire
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.waiveShippingIfInstalled ? (
                                                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        <Check className="w-3 h-3" /> Anulează Taxa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        - Se Plătește X
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Activ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Dezactivat
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteRule(r.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {isModaling && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {editingRule ? 'Editare Zonă' : 'Adăugare Zonă Nouă'}
                                </h3>
                                <button onClick={() => setIsModaling(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nume Județ / Regiune *</label>
                                    <input 
                                        type="text" 
                                        value={formData.countyCode} 
                                        onChange={e => setFormData({...formData, countyCode: e.target.value})}
                                        className="w-full border-gray-300 border rounded-lg px-3 py-2 text-gray-900"
                                        placeholder="Ex: Bucuresti, Ilfov, Prahova..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Va fi matchuit automat (case-insensitive) cu ce scrie clientul la checkout.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Preț Bază Transport (RON) per Aparat</label>
                                    <input 
                                        type="number" 
                                        value={formData.standardShippingFee} 
                                        onChange={e => setFormData({...formData, standardShippingFee: parseFloat(e.target.value)})}
                                        className="w-full border-gray-300 border rounded-lg px-3 py-2 text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Taxa hardware normală (standard = 120 Lei).</p>
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300"
                                            checked={formData.hasLocalInstallers}
                                            onChange={e => setFormData({...formData, hasLocalInstallers: e.target.checked})}
                                        />
                                        <div>
                                            <div className="font-bold text-gray-900">Acoperire Instalatori</div>
                                            <div className="text-xs text-gray-500">Bifează dacă echipele ClimaticPRO operează fizic în această zonă.</div>
                                        </div>
                                    </label>
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition border-blue-200 bg-blue-50/30">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 rounded border-blue-300"
                                            checked={formData.waiveShippingIfInstalled}
                                            onChange={e => setFormData({...formData, waiveShippingIfInstalled: e.target.checked})}
                                        />
                                        <div>
                                            <div className="font-bold text-blue-900">Promoție: Gratuit La Montaj</div>
                                            <div className="text-xs text-blue-700">Dacă e bifat, transportul devine ZERO atunci când se plasează o comandă cu serviciu de instalare atașat.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
                                <button onClick={() => setIsModaling(false)} className="px-4 py-2 font-medium text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                                    Anulare
                                </button>
                                <button onClick={saveRule} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Salvează Regula
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}
