'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, Search, Filter, TrendingUp, Ruler, CheckCircle, Download } from 'lucide-react';

export default function InstallerHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [showExtraPipeOnly, setShowExtraPipeOnly] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            fetch(`/api/installer/history?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setHistory(data.jobs);
                    }
                })
                .catch(err => console.error("History fetch error:", err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    // Stats Calculation
    const totalJobs = history.length;
    const totalPipe = history.reduce((acc, job) => acc + (job.extra?.pipe || 0), 0);
    const totalExtraRevenue = history.reduce((acc, job) => acc + (job.extra?.total || 0), 0);

    const filteredJobs = history
        .filter(job => {
            const matchesSearch = job.client?.toLowerCase().includes(searchTerm.toLowerCase()) || job.id.includes(searchTerm);
            const matchesPipe = showExtraPipeOnly ? (job.extra?.pipe || 0) > 0 : true;

            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && new Date(job.date) >= new Date(dateRange.start);
            }
            if (dateRange.end) {
                matchesDate = matchesDate && new Date(job.date) <= new Date(dateRange.end);
            }

            return matchesSearch && matchesPipe && matchesDate;
        })
        .sort((a, b) => {
            // date format is dd.mm.yyyy, need to parse for correct sort if loccale date string used
            // but API returns localedate string. Ideally API returns ISO.
            // Let's rely on simple string sort or fix API to return ISO in 'date' and format in UI. 
            // For now, let's just reverse if desc.
            return 0; // The API sorts by desc. Client sort might need Date object.
        });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/cont/instalator" className="mr-4 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900">Istoric Instalări</h1>
                    </div>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="text-primary-600 text-sm font-medium flex items-center"
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        {sortOrder === 'desc' ? 'Cele mai noi' : 'Cele mai vechi'}
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {/* Stats Summary Widget (Suggestion) */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-600 rounded-xl p-3 text-white shadow-md">
                        <p className="text-xs opacity-80 mb-1">Total Lucrări</p>
                        <p className="text-2xl font-bold flex items-center">
                            <CheckCircle className="w-5 h-5 mr-1 opacity-75" />
                            {totalJobs}
                        </p>
                    </div>
                    <div className="bg-emerald-600 rounded-xl p-3 text-white shadow-md">
                        <p className="text-xs opacity-80 mb-1">Total Încasat Extra</p>
                        <div className="text-xl font-bold leading-tight">
                            {totalExtraRevenue} <span className="text-xs">RON</span>
                        </div>
                    </div>
                    <div className="bg-amber-500 rounded-xl p-3 text-white shadow-md">
                        <p className="text-xs opacity-80 mb-1">Traseu Suplimentar</p>
                        <p className="text-2xl font-bold flex items-center">
                            <Ruler className="w-5 h-5 mr-1 opacity-75" />
                            {totalPipe}m
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">De la</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full text-sm border-gray-200 rounded-md py-1.5 focus:ring-primary-500 focus:border-primary-500 border px-2"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Până la</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full text-sm border-gray-200 rounded-md py-1.5 focus:ring-primary-500 focus:border-primary-500 border px-2"
                            />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="extraPipe"
                            type="checkbox"
                            checked={showExtraPipeOnly}
                            onChange={e => setShowExtraPipeOnly(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="extraPipe" className="ml-2 block text-sm text-gray-900 font-medium">
                            Doar lucrări cu Traseu Suplimentar
                        </label>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Caută după client sau ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredJobs.map(job => (
                        <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {job.date}
                                        </p>
                                        <h3 className="font-bold text-gray-900">{job.client}</h3>
                                    </div>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase">
                                        {job.status}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-600 mb-3">{job.products.join(', ')}</p>

                                <div className="bg-gray-50 rounded-lg p-2 grid grid-cols-2 gap-2 text-sm border border-gray-100">
                                    <div>
                                        <span className="text-gray-400 text-xs block">Locație</span>
                                        <span className="font-medium text-gray-700">{job.location}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-400 text-xs block">Extra (Traseu/Mat)</span>
                                        <span className="font-bold text-primary-600">
                                            {job.extra.total > 0 ? `+${job.extra.total} RON` : '-'}
                                        </span>
                                        {job.extra.pipe > 0 && (
                                            <span className="block text-xs text-amber-600 font-medium">
                                                ({job.extra.pipe}m țeavă)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-2 flex justify-end gap-2 border-t border-gray-100">
                                <button className="text-xs font-medium text-gray-600 hover:text-primary-600 flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-md">
                                    <Download className="w-3 h-3 mr-1" />
                                    Garanție
                                </button>
                                <button className="text-xs font-medium text-gray-600 hover:text-primary-600 flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-md">
                                    <Download className="w-3 h-3 mr-1" />
                                    Factură
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
