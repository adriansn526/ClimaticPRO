'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Box, Package } from 'lucide-react';

export default function AdminStocksView() {
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/stocks');
            const data = await res.json();
            if (data.success && data.stocks) {
                setStocks(data.stocks);
            }
        } catch (error) {
            console.error('Error loading admin stocks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStocks = stocks.filter(stock =>
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.installerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestiune Materiale & Consumabile (Teren)</h2>
                {/* 
                  Instead of editing global stocks from here, we usually just "monitor" installer stocks 
                  or we can have a button to manually dispatch stock to an installer. 
                */}
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-primary-700">
                    <Plus className="w-4 h-4 mr-2" /> Trimite Stoc către Instalator
                </button>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 max-w-lg relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Caută după material, echipament sau instalator..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="p-4">Instalator / Echipă</th>
                            <th className="p-4">Tip</th>
                            <th className="p-4">Produs / Material</th>
                            <th className="p-4 text-center">UM</th>
                            <th className="p-4 text-center">Stoc Actual Pe Teren</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Se încarcă datele...
                                </td>
                            </tr>
                        )}
                        {!loading && filteredStocks.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Nu au fost găsite stocuri pe mașini asociate în platformă.
                                </td>
                            </tr>
                        )}
                        {!loading && filteredStocks.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                            {s.installerName?.charAt(0).toUpperCase() || 'I'}
                                        </div>
                                        {s.installerName}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {s.type === 'echipament' ? (
                                        <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs w-fit">
                                            <Box className="w-3 h-3 mr-1" /> Echipament
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs w-fit">
                                            <Package className="w-3 h-3 mr-1" /> Material
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 font-medium text-gray-800">{s.name}</td>
                                <td className="p-4 text-gray-500 uppercase text-center">{s.unit || 'buc'}</td>
                                <td className="p-4 flex items-center justify-center max-w-[150px] mx-auto">
                                    <span className={`font-bold px-3 py-1 rounded-full ${s.stock <= s.minStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'}`}>
                                        {s.stock} {s.unit}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
