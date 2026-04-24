'use client';

import React, { useState, useEffect } from 'react';
import { Save, Building2, Briefcase, Phone, Mail, Landmark } from 'lucide-react';
import AdminTeamSettings from '@/components/admin/settings/AdminTeamSettings';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        companyName: '',
        cui: '',
        regCom: '',
        address: '',
        bankName: '',
        iban: '',
        contactPhone: '',
        contactEmail: '',
        global_holidays: '[]'
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'general' | 'pricing'>('general');

    // Pricing State
    const [isActive, setIsActive] = useState(false);
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
    const [premiumMarginType, setPremiumMarginType] = useState('fixed');
    const [premiumMarginValue, setPremiumMarginValue] = useState(140);
    const [basePrice12k, setBasePrice12k] = useState(950);
    const [basePrice18k, setBasePrice18k] = useState(1100);
    const [basePrice24k, setBasePrice24k] = useState(1200);
    const [maintenancePrice, setMaintenancePrice] = useState(150);
    const [repairPrice, setRepairPrice] = useState(100);
    const [extraServices, setExtraServices] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [settingsRes, pricingRes] = await Promise.all([
                fetch('/api/admin/settings'),
                fetch('/api/admin/settings/pricing')
            ]);
            
            const settingsData = await settingsRes.json();
            if (settingsData.success && settingsData.settings) {
                setSettings(prev => ({ ...prev, ...settingsData.settings }));
            }

            const pricingData = await pricingRes.json();
            if (pricingData.success && pricingData.data) {
                setIsActive(pricingData.data.isActive);
                setIsMaintenanceActive(pricingData.data.isMaintenanceActive ?? pricingData.data.isActive);
                setPremiumMarginType(pricingData.data.premiumMarginType || 'fixed');
                setPremiumMarginValue(pricingData.data.premiumMarginValue || 140);
                setBasePrice12k(pricingData.data.basePrice12k || 950);
                setBasePrice18k(pricingData.data.basePrice18k || 1100);
                setBasePrice24k(pricingData.data.basePrice24k || 1200);
                setMaintenancePrice(pricingData.data.maintenancePrice || 150);
                setRepairPrice(pricingData.data.repairPrice || 100);
                setExtraServices(pricingData.data.extraServices || []);
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Conditionally save based on the active tab
            if (activeTab === 'general') {
                const res = await fetch('/api/admin/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings })
                });
                const data = await res.json();
                if (data.success) {
                    setMessage({ type: 'success', text: 'Setările au fost salvate cu succes!' });
                } else {
                    setMessage({ type: 'error', text: data.message || 'Eroare la salvare!' });
                }
            } else {
                const res = await fetch('/api/admin/settings/pricing', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive, isMaintenanceActive, premiumMarginType, premiumMarginValue, basePrice12k, basePrice18k, basePrice24k, maintenancePrice, repairPrice, extraServices })
                });
                const data = await res.json();
                if (data.success) {
                    setMessage({ type: 'success', text: 'Prețurile au fost salvate cu succes!' });
                } else {
                    setMessage({ type: 'error', text: data.message || 'Eroare la salvare!' });
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Eroare de conexiune cu serverul.' });
        } finally {
            setSaving(false);
            
            // Hide message after 5 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const addExtra = () => {
        setExtraServices([...extraServices, { name: '', price: 0 }]);
    };

    const updateExtra = (index: number, field: string, value: any) => {
        const list = [...extraServices];
        list[index][field] = value;
        setExtraServices(list);
    };

    const removeExtra = (index: number) => {
        const list = [...extraServices];
        list.splice(index, 1);
        setExtraServices(list);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Se încarcă configurația...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    Setări Companie (ClimaticPRO)
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Informațiile completate mai jos vor fi folosite automat pentru generarea documentelor fiscale, facturilor proforme și PDF-urilor destinate partenerilor/instalatorilor B2B.
                </p>
            </div>

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`${
                            activeTab === 'general'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Informații Firmă & Setări Globale
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`${
                            activeTab === 'pricing'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Tarife Platformă (Servicii & Montaj)
                    </button>
                </nav>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} transition-all`}>
                    <p className="font-medium text-sm">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
                <div className="p-8 space-y-8">
                    {activeTab === 'general' && (
                        <>
                            {/* Section 1: Firmă */}
                            <div className="border-b border-gray-100 pb-8">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            Date Identificare
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Denumire Firmă (Vânzător)</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={settings.companyName}
                                    onChange={handleChange}
                                    placeholder="ex: CLIMATIC PRO S.R.L."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">CUI / CIF</label>
                                <input
                                    type="text"
                                    name="cui"
                                    value={settings.cui}
                                    onChange={handleChange}
                                    placeholder="ex: RO12345678"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nr. Reg. Comerțului</label>
                                <input
                                    type="text"
                                    name="regCom"
                                    value={settings.regCom}
                                    onChange={handleChange}
                                    placeholder="ex: J40/1234/2026"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                            
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Adresă Sediu Social</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={settings.address}
                                    onChange={handleChange}
                                    placeholder="ex: București, Sector 1, Șos. București-Ploiești..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact */}
                    <div className="border-b border-gray-100 pb-8">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                            <Phone className="w-5 h-5 text-gray-400" />
                            Date Contact Publice (B2B)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Secretariat / Vânzări</label>
                                <input
                                    type="tel"
                                    name="contactPhone"
                                    value={settings.contactPhone}
                                    onChange={handleChange}
                                    placeholder="ex: +40 700 000 000"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Oficial B2B</label>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-4 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={settings.contactEmail}
                                        onChange={handleChange}
                                        placeholder="comenzi@climaticpro.ro"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Banca */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                            <Landmark className="w-5 h-5 text-gray-400" />
                            Contabilitate
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nume Bancă</label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={settings.bankName}
                                    onChange={handleChange}
                                    placeholder="ex: Banca Transilvania"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                                <input
                                    type="text"
                                    name="iban"
                                    value={settings.iban}
                                    onChange={handleChange}
                                    placeholder="ex: RO00BTRL00000000000000"
                                    className="w-full px-4 py-3 uppercase rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-b border-gray-100 pb-8 mt-8">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            Disponibilitate Globală Zile Libere Platformă
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Perioade Blocate / Sărbători Legale (YYYY-MM-DD)</label>
                                <p className="text-xs text-gray-500 mb-2">Aici treci zilele libere în care rețeaua de instalatori nu funcționează. Exemplu (cu virgulă): <span className="font-mono bg-gray-100 px-1 rounded">2024-12-25, 2024-12-26, 2025-01-01</span></p>
                                <textarea
                                    name="global_holidays"
                                    value={(() => {
                                        try {
                                            const arr = JSON.parse(settings.global_holidays || '[]');
                                            return Array.isArray(arr) ? arr.join(', ') : '';
                                        } catch { return settings.global_holidays || ''; }
                                    })()}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanArr = val.split(',').map(s => s.trim()).filter(Boolean);
                                        setSettings(prev => ({ ...prev, global_holidays: JSON.stringify(cleanArr) }));
                                    }}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono block"
                                />
                            </div>
                        </div>
                    </div>
                        </>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="space-y-8">
                            {/* INSTALARE */}
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Sistem Instalare Aer Condiționat</h2>
                                <p className="text-sm text-gray-600 mb-6">Dacă activezi supra-scrierea, aplicația mobilă și prețurile instalatorilor vor fi ignorate, clientul primind prețul unic fixat mai jos.</p>
                                
                                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={isActive} 
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="form-checkbox h-6 w-6 text-blue-600 rounded"
                                    />
                                    <span className="text-lg font-bold text-gray-900">Activează prețuri corporative unice pentru Montaj & Instalare</span>
                                </label>
                            </div>

                            <div className={`space-y-8 ${!isActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">1. Montaj Aer Condiționat (Platformă)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preț Standard (9.000 - 12.000 BTU)</label>
                                            <input 
                                                type="number" 
                                                value={basePrice12k} 
                                                onChange={(e) => setBasePrice12k(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preț Standard (18.000 BTU)</label>
                                            <input 
                                                type="number" 
                                                value={basePrice18k} 
                                                onChange={(e) => setBasePrice18k(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preț Standard (24.000 BTU)</label>
                                            <input 
                                                type="number" 
                                                value={basePrice24k} 
                                                onChange={(e) => setBasePrice24k(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">2. Servicii & Materiale Suplimentare (Extra Instalare)</h3>
                                    {extraServices.map((service, index) => (
                                        <div key={index} className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="w-full md:flex-1">
                                                <input 
                                                    type="text" 
                                                    placeholder="Denumire (ex. Furtun Condens Extra)" 
                                                    value={service.name} 
                                                    onChange={(e) => updateExtra(index, 'name', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="w-full md:w-32">
                                                <input 
                                                    type="number" 
                                                    placeholder="Preț (RON)" 
                                                    value={service.price} 
                                                    onChange={(e) => updateExtra(index, 'price', Number(e.target.value))}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                                                />
                                            </div>
                                            <div className="w-full md:w-24">
                                                <input 
                                                    type="text" 
                                                    placeholder="UM (ml, buc)" 
                                                    value={service.unit || ''} 
                                                    onChange={(e) => updateExtra(index, 'unit', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase text-center"
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeExtra(index)} className="w-full md:w-auto text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-4 rounded-lg text-sm font-bold transition">Elimină</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addExtra} className="mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 border-dashed rounded-xl w-full py-4 text-sm font-bold transition">
                                        + Adaugă Serviciu Avansat Extra
                                    </button>
                                </div>
                            </div>
                            
                            {/* MENTENANȚĂ */}
                            <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 mt-10">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Sistem Mentenanță (Igienizare & Reparații)</h2>
                                <p className="text-sm text-gray-600 mb-6">Dacă acest modul este activ, clienții vor putea programa servicii de mentenanță iar prețurile listate mai jos se vor aplica direct.</p>
                                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={isMaintenanceActive} 
                                        onChange={(e) => setIsMaintenanceActive(e.target.checked)}
                                        className="form-checkbox h-6 w-6 text-teal-600 rounded"
                                    />
                                    <span className="text-lg font-bold text-gray-900">Activează modulul de Mentenanță pe platformă</span>
                                </label>
                            </div>

                            <div className={`space-y-8 ${!isMaintenanceActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Tarife Standard</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preț Igienizare Standard (RON)</label>
                                            <input 
                                                type="number" 
                                                value={maintenancePrice} 
                                                onChange={(e) => setMaintenancePrice(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preț Diagnoză / Constatare Reparații (RON)</label>
                                            <input 
                                                type="number" 
                                                value={repairPrice} 
                                                onChange={(e) => setRepairPrice(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-4">
                                        <div className="bg-teal-100 text-teal-800 font-bold py-1 px-4 rounded-full text-sm inline-block shadow-sm">
                                            Preț Final Resultant: {premiumMarginType === 'percent' ? Number(maintenancePrice) + Math.round((Number(maintenancePrice) * Number(premiumMarginValue)) / 100) : Number(maintenancePrice) + Number(premiumMarginValue)} Lei
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 pb-2 mb-6">Configurare Igienizare Premium (Algoritm)</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tip Marjă Premium</label>
                                            <select 
                                                value={premiumMarginType} 
                                                onChange={(e) => setPremiumMarginType(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold"
                                            >
                                                <option value="fixed">Sumă Fixă adăugată (+ Lei)</option>
                                                <option value="percent">Procent adăugat la Standard (+ %)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Valoare Marjă (ex: 140 sau 50%)</label>
                                            <input 
                                                type="number" 
                                                value={premiumMarginValue} 
                                                onChange={(e) => setPremiumMarginValue(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold text-teal-700"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-5 border-t border-gray-100 pt-4">* Pachetul de igienizare premium se generează adăugând marja selectată de tine la prețul curent al pachetului standard. De fiecare dată când scade sau crește prețul standard, pachetul premium își va urma formula.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Se salvează...' : 'Salvează Setările'}
                    </button>
                </div>
            </form>

            <AdminTeamSettings />
        </div>
    );
}
