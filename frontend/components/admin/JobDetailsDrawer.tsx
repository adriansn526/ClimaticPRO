"use client";

import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, MapPin, Receipt, Camera, Activity, FileText, Plus, Save } from 'lucide-react';
import Image from 'next/image';

interface JobDetailsDrawerProps {
    orderId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function JobDetailsDrawer({ orderId, isOpen, onClose }: JobDetailsDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [dispatchNote, setDispatchNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        } else {
            setOrderInfo(null);
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrderInfo(data.order);
                setDispatchNote(data.order.notes.dispatchNote || '');
            } else {
                alert('Comanda nu a putut fi extrasă total.');
            }
        } catch (e) {
            alert('Eroare la network.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!orderId) return;
        setSavingNote(true);
        try {
            const res = await fetch(`/api/dispatch/orders`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'update_admin_note',
                    note: dispatchNote
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Notița a fost salvată!');
            } else {
                alert('Eroare la salvare.');
            }
        } catch (e) {
            alert('Ceva a mers greșit.');
        } finally {
            setSavingNote(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Detalii Comandă #{orderId}</h2>
                        {orderInfo?.status && (
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                                orderInfo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                orderInfo.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                STATUS: {orderInfo.status.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : orderInfo ? (
                        <>
                            {/* 1. Informatii Client */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Informații Adresă
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Client</p>
                                        <p className="font-semibold text-gray-900">{orderInfo.customer.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone className="w-3 h-3 text-blue-500" /> 
                                            <a href={`tel:${orderInfo.customer.phone}`} className="text-sm text-blue-600 hover:underline">{orderInfo.customer.phone}</a>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail className="w-3 h-3 text-gray-400" /> 
                                            <span className="text-sm text-gray-600">{orderInfo.customer.email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Locație Montaj</p>
                                        <div className="flex items-start gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            <a 
                                                href={`https://maps.google.com/?q=${encodeURIComponent(orderInfo.customer.address + ', ' + orderInfo.customer.city)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                            >
                                                {orderInfo.customer.address}<br/>
                                                <span className="text-gray-500">{orderInfo.customer.city}, {orderInfo.customer.state}</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Produse și Financiar */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Pachet Achiziționat
                                </h3>
                                <div className="space-y-3">
                                    {orderInfo.products.map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                            <span className="font-medium text-gray-800 line-clamp-2 pr-4">{p.quantity}x {p.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm text-gray-500">Metodă Plată: {orderInfo.financial.paymentMethod}</span>
                                    <span className="text-lg font-bold text-gray-900">{orderInfo.financial.total} Lei</span>
                                </div>

                                {/* Extracosturi si B2B din Aplicatie */}
                                {orderInfo.localJob?.metadata?.extraCosts && orderInfo.localJob.metadata.extraCosts.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <span className="text-xs font-bold text-red-600 uppercase mb-2 block">Extra Costuri Solicitate de Instalator</span>
                                        {orderInfo.localJob.metadata.extraCosts.map((ec: any, idx: number) => (
                                            <div key={idx} className="flex flex-col mb-1 text-sm border-b border-red-100 pb-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-800 font-medium">{ec.description}</span>
                                                    <span className="text-red-700 font-bold">+{ec.amount} Lei</span>
                                                </div>
                                                <span className="text-xs text-gray-500">Cantitate: {ec.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {orderInfo.localJob?.metadata?.products && orderInfo.localJob.metadata.products.length > 0 && (
                                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <span className="text-xs font-bold text-indigo-600 uppercase mb-2 block">Echipamente Adăugate (B2B)</span>
                                        {orderInfo.localJob.metadata.products.filter((p:any) => p.type === 'b2b_added').map((ec: any, idx: number) => (
                                            <div key={idx} className="flex justify-between mb-1 text-sm">
                                                <span className="text-gray-800 font-medium">{ec.name}</span>
                                                <span className="text-indigo-700 text-xs">Atașat B2B</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Notițe */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4">
                                    <h3 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4" /> Notița Clientului
                                    </h3>
                                    <p className="text-sm text-amber-900 whitespace-pre-wrap">
                                        {orderInfo.notes.customerNote || <span className="italic opacity-60">Nu există cerințe speciale.</span>}
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
                                    <h3 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4" /> Comentarii Dispecerat
                                    </h3>
                                    <textarea 
                                        className="w-full bg-white border border-gray-200 rounded p-2 text-sm flex-1 min-h-[80px]"
                                        placeholder="Adaugă o notă internă (Nu o vede clientul, o poate vedea instalatorul)..."
                                        value={dispatchNote}
                                        onChange={(e) => setDispatchNote(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleSaveNote}
                                        disabled={savingNote}
                                        className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white rounded py-2 text-xs font-bold transition-colors"
                                    >
                                        <Save className="w-4 h-4" /> {savingNote ? 'Se salvează...' : 'Salvează Nota'}
                                    </button>
                                </div>
                            </div>

                            {/* 4. Media & Documente (Preluat din Local Job) */}
                            {orderInfo.localJob?.metadata?.media && orderInfo.localJob.metadata.media.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Camera className="w-4 h-4" /> Media de la Instalator
                                    </h3>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {orderInfo.localJob.metadata.media.map((img: any, idx: number) => (
                                            <a key={idx} href={img.url} target="_blank" rel="noreferrer" className="shrink-0 relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                                                <Image src={img.url} alt="Media Instalator" fill className="object-cover group-hover:scale-110 transition-transform" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {orderInfo.localJob?.metadata?.generatedDocuments && orderInfo.localJob.metadata.generatedDocuments.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Documente Generare
                                    </h3>
                                    <div className="flex flex-col gap-2 pb-2">
                                        {orderInfo.localJob.metadata.generatedDocuments.map((doc: any, idx: number) => (
                                            <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                                                <span className="text-sm font-medium text-blue-600">{doc.type === 'pv' ? 'Proces Verbal' : doc.type === 'garantie' ? 'Certificat Garanție' : 'Document PDF'}</span>
                                                <span className="text-xs text-gray-400">Deschide &rarr;</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </>
                    ) : (
                        <div className="flex justify-center mt-10 text-gray-400">Nu au fost găsite detalii.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
