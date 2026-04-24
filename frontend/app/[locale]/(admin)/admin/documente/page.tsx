'use client';

import React, { useState, useEffect } from 'react';

type DocumentItem = {
    orderId: number;
    type: string;
    url: string;
    date: string;
    customer: string;
    amount: number;
};

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetch('/api/admin/documente');
                const data = await res.json();
                if (data.success) {
                    setDocuments(data.documents);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Se încarcă arhiva documentelor...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-gray-900 mb-6">Arhivă Documente & Facturi B2B</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Tip Document</th>
                                <th className="px-6 py-4">Comandă ID</th>
                                <th className="px-6 py-4">Partener (Client)</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Dată Emitere</th>
                                <th className="px-6 py-4 text-right">Acțiune</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {documents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nu există documente arhivate încă.</td></tr>
                            ) : documents.map((doc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{doc.type}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600">
                                        #{doc.orderId}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-blue-600">
                                        {doc.customer}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">
                                        {Number(doc.amount).toFixed(2)} RON
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(doc.date).toLocaleString('ro-RO')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors font-bold text-xs"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Deschide URL
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
