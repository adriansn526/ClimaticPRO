'use client';

import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, Clock, Mail, Phone, MessageSquare, AlertCircle, X } from 'lucide-react';

type SupportTicket = {
    id: number;
    installerId: string;
    installerName: string;
    installerPhone: string;
    installerEmail: string;
    category: string;
    message: string;
    status: 'OPEN' | 'RESOLVED';
    createdAt: string;
};

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/support?status=${filter}`);
            const data = await res.json();
            if (data.success && data.tickets) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error('Eroare la preluare tichete:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async (id: number) => {
        if (!window.confirm("Ești sigur că vrei să marchezi acest tichet ca soluționat?")) return;

        try {
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'RESOLVED' })
            });
            const data = await res.json();
            if (data.success) {
                setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
                if (filter === 'OPEN') {
                    setTickets(prev => prev.filter(t => t.id !== id));
                }
                if (selectedTicket?.id === id) setSelectedTicket(null);
            } else {
                alert(data.message || 'Eroare la actualizare');
            }
        } catch (error) {
            alert('Eroare conexiune');
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-emerald-600" />
                        Suport și Tichete (App Instalatori)
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Mesajele și solicitările de suport tehnic/administrativ trimise prin aplicația de mobil.
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('OPEN')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'OPEN' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Deschise
                    </button>
                    <button
                        onClick={() => setFilter('RESOLVED')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'RESOLVED' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Rezolvate
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Toate
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tichet</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Instalator</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subiect</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        Se încarcă tichetele...
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">Ești la zi!</h3>
                                        <p className="text-gray-500">Nu am găsit niciun tichet în această categorie.</p>
                                    </td>
                                </tr>
                            ) : tickets.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">#{t.id}</div>
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(t.createdAt).toLocaleDateString('ro-RO')} {new Date(t.createdAt).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{t.installerName}</div>
                                        <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                            <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {t.installerPhone}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 truncate mt-0.5">
                                            {t.installerEmail}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-800">{t.category}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-[200px]" title={t.message}>
                                            {t.message}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {t.status === 'OPEN' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Nou / Deschis
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Soluționat
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedTicket(t)}
                                            className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-1" /> Vezi Tichet
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Vizualizare */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold flex items-center text-gray-900">
                                    Tichet #{selectedTicket.id}
                                    {selectedTicket.status === 'OPEN' ? (
                                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                            în Așteptare
                                        </span>
                                    ) : (
                                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Soluționat
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{new Date(selectedTicket.createdAt).toLocaleString('ro-RO')}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Instalator</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedTicket.installerName}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Contact</p>
                                    <a href={`tel:${selectedTicket.installerPhone}`} className="text-sm font-medium text-emerald-600 flex items-center hover:underline">
                                        <Phone className="w-4 h-4 mr-2" />
                                        {selectedTicket.installerPhone}
                                    </a>
                                    <a href={`mailto:${selectedTicket.installerEmail}`} className="text-sm font-medium text-blue-600 flex items-center hover:underline">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {selectedTicket.installerEmail}
                                    </a>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                {selectedTicket.category}
                            </h3>
                            
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {selectedTicket.message}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Închide fereastra
                            </button>
                            
                            {selectedTicket.status === 'OPEN' && (
                                <button
                                    onClick={() => handleMarkResolved(selectedTicket.id)}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marchează ca Soluționat
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
