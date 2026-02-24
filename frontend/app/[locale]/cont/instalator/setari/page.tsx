'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Building, Info, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

export default function InstallerSettingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        companyName: '',
        cui: '',
        regCom: '',
        bankName: '',
        iban: '',
        address: ''
    });

    // Fetch existing settings
    useEffect(() => {
        if (!user) return;
        async function fetchSettings() {
            setLoading(true);
            try {
                // Assuming user.id is the WP User ID. If it's something else, we need to resolve it.
                // In generic AuthContext, user.id might be a UUID or string. Ideally passed from backend login.
                const res = await fetch(`/api/user/installer-profile?userId=${user.id}`);
                const data = await res.json();
                if (data.success) {
                    setForm(data.profile);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch('/api/user/installer-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, ...form })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Datele companiei au fost salvate!', 'success');
            } else {
                showToast('Eroare la salvare: ' + data.message, 'error');
            }
        } catch (e) {
            showToast('Eroare conexiune server.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/cont/instalator" className="p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900">Setări Instalator</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 max-w-lg">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        Aceste date vor apărea automat la rubrica <strong>"Prestator"</strong> pe Facturile și Procesele Verbale generate din aplicație.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Denumire Companie (SRL/PFA)</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="SC INSTALATOR SRL"
                                        value={form.companyName}
                                        onChange={e => setForm({ ...form, companyName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">CUI / CIF</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="RO123456"
                                        value={form.cui}
                                        onChange={e => setForm({ ...form, cui: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Reg. Com.</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="J40/123/2024"
                                        value={form.regCom}
                                        onChange={e => setForm({ ...form, regCom: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Banca</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Banca Transilvania"
                                    value={form.bankName}
                                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Cont IBAN</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                    placeholder="RO00 BTRL..."
                                    value={form.iban}
                                    onChange={e => setForm({ ...form, iban: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Adresa Sediu Social</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Str. Exemplului Nr. 1, București..."
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                <div className="flex items-center">
                                    <input
                                        id="vat-payer"
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={(form as any).isVatPayer || false}
                                        onChange={e => setForm({ ...form, isVatPayer: e.target.checked } as any)}
                                    />
                                    <label htmlFor="vat-payer" className="ml-2 block text-sm text-gray-900 font-bold">
                                        Compania este plătitoare de TVA
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Informații Suplimentare Garanție</label>
                                    <p className="text-xs text-gray-500 mb-2">Acest text va apărea pe certificatul de garanție (ex: program de lucru, condiții specifice).</p>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        rows={4}
                                        placeholder="Ex: Intervențiile se realizează în 24-48h de la sesizare..."
                                        value={(form as any).warrantyInfo || ''}
                                        onChange={e => setForm({ ...form, warrantyInfo: e.target.value } as any)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Save className="w-5 h-5 mr-2" /> Salvează Datele</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
