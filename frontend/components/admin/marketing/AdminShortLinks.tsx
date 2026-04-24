'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Copy, ExternalLink, Activity, AlertCircle } from 'lucide-react';

export default function AdminShortLinks() {
    const [links, setLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [newCode, setNewCode] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/admin/shortlinks');
            const data = await res.json();
            if (data.success) {
                setLinks(data.links);
            }
        } catch (e) {
            alert('Eroare la încărcarea linkurilor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !newTarget) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/shortlinks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortCode: newCode, targetUrl: newTarget })
            });

            const data = await res.json();
            if (data.success) {
                alert('Link creat cu succes!');
                setLinks([data.link, ...links]);
                setNewCode('');
                setNewTarget('');
            } else {
                alert(data.error || 'Eroare la creare');
            }
        } catch (e) {
            alert('Eroare de comunicare');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!window.confirm(`Sigur ștergi linkul scurt /s/${code} ? Orice accesări viitoare nu vor mai funcționa.`)) return;

        try {
            const res = await fetch(`/api/admin/shortlinks?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('Șters cu succes');
                setLinks(links.filter(l => l.id !== id));
            } else {
                alert('Eroare la ștergere');
            }
        } catch (e) {
            alert('Eroare de ștergere');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiat în clipboard!');
    };

    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://climaticpro.ro';

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                    <LinkIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Generator Link-uri Scurte
                </h3>
                <p className="text-gray-500 mb-6 max-w-2xl text-sm">
                    Generează alias-uri scurte (tracking URLs) direct către subpaginile platformei tale (cu UTM-uri incluse). Utile pentru trimis în SMS-uri. 
                    <br />Sistemul va prelua clientul și îl va redirecționa automat spre URL-ul destinație.
                </p>

                <form onSubmit={handleCreate} className="space-y-5 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Destinație Finală (URL Lung + UTM)</label>
                        <input
                            type="url"
                            required
                            placeholder="ex: https://climaticpro.ro/mentenanta?utm_source=sms&utm_medium=campaign..."
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Forma Cod Scurt (Custom)</label>
                            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                                <div className="px-4 py-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm flex items-center shrink-0">
                                    climaticpro.ro/s/
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="ex: ig26 sau promo-ac"
                                    className="w-full px-4 py-3 outline-none"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            {isSubmitting ? 'Se salvează...' : 'Crează Link Scurt'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-gray-800 text-lg">Link-uri Active</h4>
                    <div className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                        {links.length} Link-uri
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="p-12 pl-6 flex justify-center items-center text-gray-400">
                        Se încarcă baza de date...
                    </div>
                ) : links.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                        <LinkIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p>Nu ai generat niciun link scurt până acum.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Cod / Link Scurt</th>
                                    <th className="px-6 py-4">Sursa Destinație</th>
                                    <th className="px-6 py-4 text-center">Click-uri (Accesări)</th>
                                    <th className="px-6 py-4 text-right">Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {links.map(link => (
                                    <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-mono font-bold text-sm tracking-wide">
                                                    /s/{link.shortCode}
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard(`${originUrl}/s/${link.shortCode}`)}
                                                    className="ml-2 text-gray-400 hover:text-blue-600 transition p-1"
                                                    title="Copiază Linkul Complet"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center max-w-[400px]">
                                                <span className="text-sm text-gray-600 truncate mr-2" title={link.targetUrl}>
                                                    {link.targetUrl}
                                                </span>
                                                <a href={link.targetUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 shrink-0">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center">
                                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full ${link.clicks > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    <span className="font-black text-lg leading-tight">{link.clicks}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handleDelete(link.id, link.shortCode)}
                                                className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
