'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Wrench, MessageSquare, ClipboardList, PackageOpen, XCircle, CheckCircle, Send, Loader2 } from 'lucide-react';

interface InstallerDetailsModalProps {
    installerId: string;
    onClose: () => void;
}

export default function InstallerDetailsModal({ installerId, onClose }: InstallerDetailsModalProps) {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [savingPricing, setSavingPricing] = useState(false);
    const [pricingForm, setPricingForm] = useState({ premiumType: '', premiumValue: '' });

    // SMS State
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [smsStatus, setSmsStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetch(`/api/admin/installers/${installerId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data);
                    setPricingForm({
                        premiumType: res.data.profile.premiumType || '',
                        premiumValue: res.data.profile.premiumValue?.toString() || ''
                    });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load installer details", err);
                setLoading(false);
            });
    }, [installerId]);

    const handleSendSMS = async () => {
        if (!messageText.trim()) return;
        setSending(true);
        setSmsStatus(null);
        try {
            const res = await fetch(`/api/admin/installers/${installerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText })
            });
            const result = await res.json();
            if (result.success) {
                setSmsStatus({ type: 'success', text: 'Mesaj trimis cu succes!' });
                setMessageText('');
            } else {
                setSmsStatus({ type: 'error', text: result.error || 'Eroare la trimitere.' });
            }
        } catch (error) {
            setSmsStatus({ type: 'error', text: 'Eroare de rețea.' });
        }
        setSending(false);
    };

    const handleSavePricing = async () => {
        setSavingPricing(true);
        try {
            const res = await fetch(`/api/admin/installers/${installerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    premiumType: pricingForm.premiumType, 
                    premiumValue: pricingForm.premiumValue 
                })
            });
            const result = await res.json();
            if (result.success) {
                alert('Setari premium actualizate cu succes!');
                setData({ ...data, profile: result.data });
            } else {
                alert('Eroare la salvare: ' + result.error);
            }
        } catch(e) {
            alert('A aparut o eroare.');
        }
        setSavingPricing(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="text-gray-700 font-medium">Se încarcă datele...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { profile, teamMembers, jobs, stocks } = data;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                            {(profile.name || profile.companyName || '?').charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{profile.name || profile.companyName || 'Instalator Necunoscut'}</h2>
                            <p className="text-sm text-gray-500">
                                {profile.email || 'Nespecificat'} • {profile.phone || 'Nespecificat'} • Status:
                                <span className={`ml-1 font-semibold ${profile.status === 'approved' ? 'text-emerald-600' : profile.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                                    {profile.status.toUpperCase()}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-gray-200 px-6 overflow-x-auto print:hidden shrink-0">
                    {[
                        { id: 'profile', icon: Building2, label: 'Date Firmă' },
                        { id: 'pricing', icon: Wrench, label: 'Prețuri & Decont' },
                        { id: 'history', icon: ClipboardList, label: 'Istoric Lucrări' },
                        { id: 'stocks', icon: PackageOpen, label: 'Stocuri' },
                        { id: 'messages', icon: MessageSquare, label: 'Mesagerie SMS' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 min-h-0">

                    {/* TAB: PROFILE */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    Date Fiscale
                                </h3>
                                <div className="space-y-3">
                                    <DetailRow label="Nume Companie" value={profile.companyName} />
                                    <DetailRow label="CUI" value={profile.cui} />
                                    <DetailRow label="Reg. Com." value={profile.regCom} />
                                    <DetailRow label="Adresă" value={profile.address} />
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-gray-400" />
                                    Echipă & Setări
                                </h3>
                                <div className="space-y-3">
                                    <DetailRow label="Tehnicieni Asociați" value={teamMembers?.length?.toString() || '0'} />
                                    <DetailRow label="Zonă Acoperire" value={profile.coverageLat ? `Setată (${profile.coverageRadius}km)` : 'Generala'} />
                                    <DetailRow label="Plătitor TVA" value={profile.isVatPayer ? 'Da' : 'Nu'} />
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Date Bancare</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow label="Nume Bancă" value={profile.bankName} />
                                    <DetailRow label="Cont IBAN" value={profile.iban} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PRICING */}
                    {activeTab === 'pricing' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-emerald-600" />
                                Configurare Decont (Premium)
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Aceste setări sunt folosite <strong className="text-gray-900">exclusiv pentru decontul intern</strong>. Nu afectează prețul global plătit de clientul final pe site.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Profil</label>
                                    <input 
                                        type="text" 
                                        disabled 
                                        value={profile.isInternal ? 'Instalator Intern' : 'Instalator Extern'} 
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-bold"
                                    />
                                </div>
                            </div>
                            
                            <div className="border border-emerald-100 bg-emerald-50/30 p-5 rounded-xl space-y-4">
                                <h4 className="font-bold text-emerald-800">Adaos / Decont Instalări Premium</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tip Calcul Premium</label>
                                        <select 
                                            value={pricingForm.premiumType} 
                                            onChange={e => setPricingForm({ ...pricingForm, premiumType: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">Fără adaos (Standard)</option>
                                            <option value="fixed">Preț Fix Suplimentar (RON)</option>
                                            <option value="percentage">Procentual (%) din manoperă</option>
                                        </select>
                                    </div>

                                    {pricingForm.premiumType && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valoare ({pricingForm.premiumType === 'percentage' ? '%' : 'RON'})</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                value={pricingForm.premiumValue}
                                                onChange={e => setPricingForm({ ...pricingForm, premiumValue: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="ex: 15.5 sau 250"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <button 
                                        onClick={handleSavePricing}
                                        disabled={savingPricing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {savingPricing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
                                        Salvează Setări Decont
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {!jobs || jobs.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Nicio lucrare înregistrată.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Client</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Locație</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Dată</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job: any) => (
                                            <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-3 text-sm text-gray-900">#{job.id}</td>
                                                <td className="p-3 text-sm font-medium text-gray-900">{job.clientName}</td>
                                                <td className="p-3 text-sm text-gray-500 truncate max-w-[200px]" title={job.address}>{job.address}</td>
                                                <td className="p-3">
                                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            job.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {job.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-gray-500">
                                                    {new Date(job.createdAt).toLocaleDateString('ro-RO')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* TAB: STOCKS */}
                    {activeTab === 'stocks' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {!stocks || stocks.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Niciun stoc alocat.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-3 text-sm font-semibold text-gray-600">Nume Produs / Material</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Tip</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Cantitate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.map((stock: any) => (
                                            <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-3 text-sm font-medium text-gray-900">{stock.name}</td>
                                                <td className="p-3 text-sm text-gray-500 capitalize">{stock.type}</td>
                                                <td className="p-3 text-sm font-bold text-gray-900">
                                                    {stock.stock} <span className="text-gray-500 font-normal">{stock.unit}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* TAB: MESSAGES */}
                    {activeTab === 'messages' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary-600" />
                                Trimite SMS Direct
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Mesajul va fi trimis instantaneu pe numărul de telefon asociat acestui cont ({profile.phone || 'Lipsă Telefon'}). Costul va fi dedus din creditul SMSO al platformei.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Continut Mesaj</label>
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        rows={4}
                                        placeholder="Ex: Salut, te rugăm să preiei lucrarea #102 din zona Ilfov cat mai curând."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className={`text-xs ${messageText.length > 160 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                            {messageText.length} / 160 caractere (1 credit)
                                        </span>
                                    </div>
                                </div>

                                {smsStatus && (
                                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${smsStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        {smsStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {smsStatus.text}
                                    </div>
                                )}

                                <button
                                    onClick={handleSendSMS}
                                    disabled={sending || !messageText.trim()}
                                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {sending ? 'Se trimite...' : 'Trimite Mesaj SMS'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{value || <span className="text-gray-300 italic">Nespecificat</span>}</span>
        </div>
    );
}
