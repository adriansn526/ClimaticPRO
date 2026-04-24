'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Plus, Trash2, CheckCircle, AlertTriangle, FileText, Printer, Calculator } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

// Mock Data Removed - Using API

interface InvoiceItem {
    id: string;
    name: string;
    um: string;
    qty: number;
    price: number;
    isCustom?: boolean;
}

export default function JobDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    // Hooks must be inside the component
    const { user } = useAuth();

    // Fetch Settings
    const [installerProfile, setInstallerProfile] = useState<any>(null);

    useEffect(() => {
        if (user?.id) {
            fetch(`/api/user/installer-profile?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.profile) {
                        setInstallerProfile(data.profile);
                    }
                })
                .catch(err => console.error("Error fetching profile:", err));
        }
    }, [user]);

    console.log("JobDetailPage v4: Fixed Hook Call");

    const [job, setJob] = useState<any>(null);
    const [activeTab, setActiveTab] = useState(1);

    // ... existing state ...
    const [verifiedProducts, setVerifiedProducts] = useState<string[]>([]);
    const [extraVerifiedItems, setExtraVerifiedItems] = useState<{ id: string, name: string, qty: string }[]>([]);
    const [newExtraItem, setNewExtraItem] = useState({ name: '', qty: '' });

    // Materials (Internal use / Consumption)
    const [materials, setMaterials] = useState<{ name: string, qty: string }[]>([]);
    const [newMaterial, setNewMaterial] = useState({ name: '', qty: '' });

    // Warranty SNs
    const [serials, setSerials] = useState<Record<string, { ui: string, ue: string }>>({});

    // Invoice Data
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [newItem, setNewItem] = useState({ name: '', um: 'buc', qty: 1, price: 0 });

    const router = useRouter();
    const { showToast } = useToast();

    // --- Effects ---


    useEffect(() => {
        if (id) {
            fetch(`/api/jobs/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.job) {
                        const jobData = data.job;
                        setJob(jobData);
                        setVerifiedProducts(jobData.products.map((p: any) => p.id));

                        // Init Invoice with Verified Products
                        const initialInvoice = jobData.products.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            um: 'buc',
                            qty: 1,
                            price: p.price,
                            isCustom: false
                        }));
                        setInvoiceItems(initialInvoice);
                    } else {
                        showToast("Job not found", "error");
                    }
                })
                .catch(err => {
                    console.error("Error fetching job:", err);
                    showToast("Error loading job", "error");
                });
        }
    }, [id]);

    // Effect to Sync Extra Verified Items to Invoice
    useEffect(() => {
        // Find items in extraVerifiedItems that are NOT in invoice
        const extrasToAdd = extraVerifiedItems.filter(e => !invoiceItems.some(i => i.id === e.id));

        if (extrasToAdd.length > 0) {
            const newInvoiceItems = extrasToAdd.map(e => ({
                id: e.id,
                name: e.name,
                um: 'buc', // Default
                qty: parseFloat(e.qty) || 1,
                price: 0, // Needs manual price set
                isCustom: true
            }));
            setInvoiceItems(prev => [...prev, ...newInvoiceItems]);
        }
    }, [extraVerifiedItems, invoiceItems]);

    // if (!job) return <div className="p-8 text-center">Incarcare...</div>;

    // --- Handlers ---

    const addExtraVerifiedItem = () => {
        if (!newExtraItem.name) return;
        const item = {
            id: `extra-${Date.now()}`,
            name: newExtraItem.name,
            qty: newExtraItem.qty || '1'
        };
        setExtraVerifiedItems([...extraVerifiedItems, item]);
        setNewExtraItem({ name: '', qty: '' });
    };

    const removeExtraVerifiedItem = (id: string) => {
        setExtraVerifiedItems(extraVerifiedItems.filter(i => i.id !== id));
    };

    const toggleProduct = (id: string) => {
        const isNowChecked = !verifiedProducts.includes(id);
        if (verifiedProducts.includes(id)) {
            setVerifiedProducts(verifiedProducts.filter(pid => pid !== id));
            // Remove from invoice if unverified? Maybe optional. 
            // User said "sa pot elimina ce vreau" from invoice.
        } else {
            setVerifiedProducts([...verifiedProducts, id]);
        }
    };

    const addMaterial = () => {
        if (!newMaterial.name) return;
        setMaterials([...materials, newMaterial]);
        setNewMaterial({ name: '', qty: '' });
    };

    const updateSerial = (productId: string, type: 'ui' | 'ue', value: string) => {
        setSerials(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [type]: value
            }
        }));
    };

    const addInvoiceItem = () => {
        if (!newItem.name) return;
        const item: InvoiceItem = {
            id: `custom-${Date.now()}`,
            name: newItem.name,
            um: newItem.um,
            qty: newItem.qty,
            price: newItem.price,
            isCustom: true
        };
        setInvoiceItems([...invoiceItems, item]);
        setNewItem({ name: '', um: 'buc', qty: 1, price: 0 });
    };

    const removeInvoiceItem = (id: string) => {
        setInvoiceItems(invoiceItems.filter(i => i.id !== id));
    };

    const invoiceTotal = invoiceItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // --- PDF Action Handler (Email or Download) ---
    const handlePdfAction = async (type: 'warranty' | 'invoice', action: 'email' | 'download') => {
        try {
            const loadingMsg = action === 'email' ? "Se trimite emailul..." : "Se generează PDF-ul...";
            showToast(loadingMsg, "info");

            // Prepare Data Payload
            let dataPayload = {};
            if (type === 'warranty') {
                dataPayload = {
                    jobId: job.id,
                    client: { name: job.client, address: job.address },
                    installer: {
                        companyName: installerProfile?.companyName || "Nume Companie Nedefinit",
                        cui: installerProfile?.cui || '-',
                        warrantyInfo: installerProfile?.warrantyInfo || ''
                    },
                    products: job.products
                        .filter((p: any) => p.type === 'ac' && verifiedProducts.includes(p.id))
                        .map((p: any) => ({
                            name: p.name,
                            sn_ui: serials[p.id]?.ui || '-',
                            sn_ue: serials[p.id]?.ue || '-',
                            warranty: '24 Luni'
                        })),
                    date: new Date().toLocaleDateString('ro-RO')
                };
            } else {
                dataPayload = {
                    series: "PRO",
                    number: job.id,
                    date: new Date().toLocaleDateString('ro-RO'),
                    provider: {
                        name: installerProfile?.companyName || "Compania Ta",
                        cui: installerProfile?.cui || "-",
                        address: installerProfile?.address || "-",
                        bank: installerProfile?.bankName || "-",
                        iban: installerProfile?.iban || "-"
                    },
                    client: { name: job.client, address: job.address },
                    items: invoiceItems.map(item => ({
                        name: item.name, um: item.um, qty: item.qty, price: item.price, total: item.price * item.qty
                    })),
                    total: invoiceTotal
                };
            }

            if (action === 'email') {
                const res = await fetch('/api/email/send-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobId: job.id,
                        clientEmail: job.email || 'contact@climaticpro.ro',
                        type,
                        installerName: installerProfile?.companyName || '',
                        data: dataPayload
                    })
                });

                const resData = await res.json();
                if (resData.success) {
                    showToast(`Email trimis cu succes!`, "success");
                } else {
                    showToast("Eroare la trimiterea emailului.", "error");
                }
            } else {
                // Download
                const res = await fetch('/api/pdf/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data: dataPayload })
                });

                if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${type === 'warranty' ? 'Garantie' : 'Factura'}_${job.id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    showToast("PDF descărcat cu succes!", "success");
                } else {
                    showToast("Eroare la generarea PDF.", "error");
                }
            }

        } catch (error) {
            console.error("Action Error:", error);
            showToast("Eroare neașteptată.", "error");
        }
    };

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-medium text-gray-600">Se încarcă datele jobului...</p>
                    <p className="text-xs text-gray-400 mt-2">v2 Safe Render</p>
                </div>
            </div>
        );
    }

    const handleFinalizeJob = async () => {
        if (!confirm("Sigur doriți să finalizați lucrarea? Această acțiune este ireversibilă și va muta lucrarea în Istoric.")) {
            return;
        }

        try {
            showToast("Se finalizează lucrarea...", "info");

            const finalData = {
                verifiedProducts,
                extraVerifiedItems,
                materials, // internal consumption
                serials,
                invoiceItems,
                finalTotal: invoiceTotal
            };

            const res = await fetch(`/api/jobs/${job.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed',
                    data: finalData
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast("Lucrare finalizată cu succes!", "success");
                setTimeout(() => {
                    router.push('/cont/instalator/istoric');
                }, 1500);
            } else {
                showToast("Eroare la finalizare.", "error");
            }

        } catch (error) {
            console.error("Finalize Error:", error);
            showToast("Eroare de conexiune.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            {/* ... same header ... */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/cont/instalator" className="mr-4 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">{job.client}</h1>
                            <p className="text-xs text-gray-500">#{job.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleFinalizeJob}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizează
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {/* Contact Info */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex items-start text-gray-700">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                        <span>{job.address}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                        <Phone className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                        <a href={`tel:${job.phone}`} className="text-primary-600 font-medium">{job.phone}</a>
                    </div>
                </div>

                {/* Tabs - Fixed Contrast */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab(1)}
                        className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold transition-all border ${activeTab === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        1. Verificare
                    </button>
                    <button
                        onClick={() => setActiveTab(2)}
                        className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold transition-all border ${activeTab === 2 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        2. Materiale
                    </button>
                    <button
                        onClick={() => setActiveTab(3)}
                        className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold transition-all border ${activeTab === 3 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        3. Documente
                    </button>
                </div>

                {/* Step 1: Verification */}
                {activeTab === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h2 className="font-bold text-gray-800">Ce s-a instalat efectiv?</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {job.products.map((p: any) => (
                                    <label key={p.id} className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={verifiedProducts.includes(p.id)}
                                            onChange={() => toggleProduct(p.id)}
                                            className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className={`ml-3 text-sm font-medium ${verifiedProducts.includes(p.id) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                            {p.name}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Extra Installed Items Section */}
                            <div className="p-4 bg-yellow-50 border-t border-yellow-100">
                                <h3 className="text-xs font-bold text-yellow-800 uppercase mb-2">Alte elemente instalate (Traseu, Console)</h3>
                                <div className="space-y-2 mb-3">
                                    {extraVerifiedItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-yellow-200">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                                <span className="text-xs text-gray-500 ml-2">({item.qty})</span>
                                            </div>
                                            <button onClick={() => removeExtraVerifiedItem(item.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        placeholder="Ex: Traseu Extra (m)"
                                        className="flex-1 text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-blue-500 focus:border-blue-500"
                                        value={newExtraItem.name}
                                        onChange={e => setNewExtraItem({ ...newExtraItem, name: e.target.value })}
                                    />
                                    <input
                                        placeholder="Cant"
                                        className="w-20 text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-blue-500 focus:border-blue-500"
                                        value={newExtraItem.qty}
                                        onChange={e => setNewExtraItem({ ...newExtraItem, qty: e.target.value })}
                                    />
                                    <button
                                        onClick={addExtraVerifiedItem}
                                        disabled={!newExtraItem.name}
                                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Materials */}
                {activeTab === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h2 className="font-bold text-gray-800 mb-4">Consumabile & Materiale (Intern)</h2>

                            <div className="space-y-3 mb-4">
                                {materials.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                        <div className="text-sm">
                                            <span className="font-medium">{m.name}</span>
                                            {m.qty && <span className="text-gray-500 ml-2">({m.qty})</span>}
                                        </div>
                                        <button onClick={() => setMaterials(materials.filter((_, i) => i !== idx))} className="text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 items-end pt-2">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newMaterial.name}
                                        onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                        placeholder="Ex: Dibluri 10mm"
                                        className="block w-full text-sm rounded-md border-gray-300 py-2 px-3 border"
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="text"
                                        value={newMaterial.qty}
                                        onChange={e => setNewMaterial({ ...newMaterial, qty: e.target.value })}
                                        placeholder="10 buc"
                                        className="block w-full text-sm rounded-md border-gray-300 py-2 px-3 border"
                                    />
                                </div>
                                <button onClick={addMaterial} disabled={!newMaterial.name} className="bg-primary-600 text-white p-2 rounded-md">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Documente (Warranty & Invoice) */}
                {activeTab === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">

                        {/* Section A: Warranty */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                            <h2 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                                <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
                                1. Certificat Garanție
                            </h2>

                            <div className="space-y-6">
                                {job.products.filter((p: any) => p.type === 'ac' && verifiedProducts.includes(p.id)).map((p: any) => (
                                    <div key={p.id} className="bg-blue-50/50 p-4 rounded-lg">
                                        <p className="font-bold text-sm text-blue-900 mb-3">{p.name}</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">SN Unitate Internă</label>
                                                <input
                                                    type="text"
                                                    value={serials[p.id]?.ui || ''}
                                                    onChange={e => updateSerial(p.id, 'ui', e.target.value)}
                                                    placeholder="UI Serial No..."
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">SN Unitate Externă</label>
                                                <input
                                                    type="text"
                                                    value={serials[p.id]?.ue || ''}
                                                    onChange={e => updateSerial(p.id, 'ue', e.target.value)}
                                                    placeholder="UE Serial No..."
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePdfAction('warranty', 'download')}
                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Descarcă PDF
                                    </button>
                                    <button
                                        onClick={() => handlePdfAction('warranty', 'email')}
                                        className="flex-1 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium text-sm flex items-center justify-center"
                                    >
                                        <div className="w-4 h-4 mr-2">📧</div>
                                        Trimite Email
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section B: Invoice */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-emerald-500">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-gray-800 flex items-center text-lg">
                                    <Calculator className="w-5 h-5 mr-2 text-emerald-500" />
                                    2. Factură Fiscală
                                </h2>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Fără TVA</span>
                            </div>

                            {/* Invoice Items List */}
                            <div className="space-y-2 mb-6">
                                {invoiceItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex-1 pr-2">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-gray-500 text-xs">{item.qty} {item.um} x {item.price} RON</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold text-gray-900 mr-3">{(item.qty * item.price).toFixed(2)}</span>
                                            <button onClick={() => removeInvoiceItem(item.id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Row */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                                    <span className="text-lg font-bold text-gray-800">Total de Plată</span>
                                    <span className="text-xl font-bold text-emerald-600">{invoiceTotal.toFixed(2)} RON</span>
                                </div>
                            </div>

                            {/* Add Custom Item Form */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Adaugă pe factură (Traseu, Manoperă extra)</p>
                                <div className="grid grid-cols-12 gap-2 mb-2">
                                    <div className="col-span-12">
                                        <input
                                            placeholder="Denumire (ex: Traseu Extra)"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            placeholder="UM"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newItem.um}
                                            onChange={e => setNewItem({ ...newItem, um: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="Cant"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newItem.qty.toString()}
                                            onChange={e => setNewItem({ ...newItem, qty: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="number"
                                            placeholder="Preț"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newItem.price.toString()}
                                            onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <button
                                            onClick={addInvoiceItem}
                                            disabled={!newItem.name}
                                            className="w-full h-full bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Presets */}
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    <button
                                        onClick={() => setNewItem({ name: 'Traseu Frigorific Extra', um: 'ml', qty: 1, price: 100 })}
                                        className="whitespace-nowrap px-2 py-1 bg-white border border-gray-200 text-xs rounded-full hover:border-emerald-500 hover:text-emerald-700"
                                    >
                                        + Traseu Extra
                                    </button>
                                    <button
                                        onClick={() => setNewItem({ name: 'Set Console', um: 'set', qty: 1, price: 80 })}
                                        className="whitespace-nowrap px-2 py-1 bg-white border border-gray-200 text-xs rounded-full hover:border-emerald-500 hover:text-emerald-700"
                                    >
                                        + Console
                                    </button>
                                    <button
                                        onClick={() => setNewItem({ name: 'Demontare AC Vechi', um: 'buc', qty: 1, price: 150 })}
                                        className="whitespace-nowrap px-2 py-1 bg-white border border-gray-200 text-xs rounded-full hover:border-emerald-500 hover:text-emerald-700"
                                    >
                                        + Demontare
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handlePdfAction('invoice', 'download')}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm flex items-center justify-center"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    Descarcă Factură
                                </button>
                                <button
                                    onClick={() => handlePdfAction('invoice', 'email')}
                                    className="flex-1 py-3 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center"
                                >
                                    <div className="w-5 h-5 mr-2 flex items-center justify-center">📧</div>
                                    Trimite Email
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

