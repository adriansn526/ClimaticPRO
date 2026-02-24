'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Briefcase, MapPin, Phone, Calendar, CheckSquare, Clock, User, LogOut, ShoppingBag, History as HistoryIcon, ArrowRight, Bell, DollarSign, Settings } from 'lucide-react';

export default function InstallerDashboard() {
    const { user, logout } = useAuth();

    // State for Real Data
    const [availableJobs, setAvailableJobs] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]); // Active Jobs
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);

    // Fetch Active Jobs
    useEffect(() => {
        if (!user?.id) return;

        async function fetchActiveJobs() {
            if (!user?.id) return; // Guard again for TS
            try {
                const res = await fetch(`/api/installer/jobs?userId=${user.id}&status=active`);
                const data = await res.json();
                if (data.success) {
                    setJobs(data.jobs);
                }
            } catch (error) {
                console.error("Failed to fetch active jobs", error);
            } finally {
                setIsLoadingJobs(false);
            }
        }

        fetchActiveJobs();
        // Poll for updates
        const interval = setInterval(fetchActiveJobs, 15000);
        return () => clearInterval(interval);
    }, [user]);


    useEffect(() => {
        async function fetchAvailableJobs() {
            // In real app, installer region comes from Profile. Mocking 'Voluntari' or 'Bucuresti' based on user
            const region = 'Bucuresti';
            try {
                const res = await fetch(`/api/dispatch/orders?role=installer&region=${region}`);
                const data = await res.json();
                if (data.success) {
                    setAvailableJobs(data.orders);
                }
            } catch (error) {
                console.error('Error fetching jobs', error);
            }
        }
        fetchAvailableJobs();
        const interval = setInterval(fetchAvailableJobs, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const acceptJob = async (id: string) => {
        // Optimistic UI remove
        setAvailableJobs(prev => prev.filter(j => j.id !== id));

        try {
            await fetch('/api/dispatch/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: id,
                    action: 'accept',
                    installerName: user?.name,
                    installerId: user?.id
                })
            });
            // Ideally notify success or refresh active jobs
            // Trigger a re-fetch of active jobs (or reload page for simplicity)
            window.location.reload(); // Simple refresh for now to sync states
        } catch (e) {
            console.error('Accept failed', e);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Programat</span>;
            case 'in_progress': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">În Lucru</span>;
            case 'completed': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Finalizat</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-20">
            {/* Mobile Top Bar */}
            <div className="bg-gray-900 text-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-full text-white">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-300">Instalator</p>
                            <h1 className="text-sm font-bold truncate max-w-[150px] text-white">{user?.name || 'Partener'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link href="/cont/instalator/setari" className="p-2 text-white hover:text-gray-200 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                            <Settings className="h-5 w-5" />
                        </Link>
                        <button onClick={logout} className="p-2 text-white hover:text-gray-200 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {/* NEW: Available Jobs Notification */}
                {availableJobs.length > 0 ? (
                    <div className="space-y-4 mb-6">
                        {availableJobs.map(job => (
                            <div key={job.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                                    Disponibil Acum
                                </div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                                    În zona ta ({job.region})
                                </h2>

                                <h3 className="font-bold text-lg text-gray-900 mb-1">Instalare: {job.product}</h3>
                                <p className="text-sm text-gray-600 mb-4">{job.address} • {job.client}</p>

                                <button
                                    onClick={() => acceptJob(job.id)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center">
                                    <CheckSquare className="w-5 h-5 mr-2" />
                                    Acceptă Lucrarea
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mb-6 bg-white p-4 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                        <p className="text-sm">Nu există lucrări noi disponibile în zona ta momentan.</p>
                    </div>
                )}

                {/* Statistics / Quick Actions */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Link href="/cont/instalator/istoric" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:bg-gray-50 transition-colors group h-32">
                        <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-200 transition-colors">
                            <HistoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Istoric</h3>
                            <p className="text-xs text-gray-500">Lucrări finalizate</p>
                        </div>
                    </Link>

                    <Link href="/cont/instalator/magazin" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:bg-gray-50 transition-colors group h-32">
                        <div className="bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-200 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Magazin Pro</h3>
                            <p className="text-xs text-gray-500">Consumabile & Scule</p>
                        </div>
                    </Link>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-4">Lucrări Active</h2>

                <div className="space-y-4">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-[0.98] transition-transform relative">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center text-sm font-semibold text-gray-900">
                                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                        {job.date}
                                    </div>
                                    {getStatusBadge(job.status)}
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <Link href={`/cont/instalator/job/${job.id}`} className="hover:underline">
                                        <h3 className="text-lg font-bold text-gray-900">{job.client}</h3>
                                    </Link>
                                    <a
                                        href={`tel:${job.phone}`}
                                        className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                        title={`Sună clientul: ${job.phone}`}
                                    >
                                        <Phone className="w-5 h-5" />
                                    </a>
                                </div>

                                <div className="flex items-start text-gray-600 text-sm mb-3">
                                    <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{job.address}</span>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">De Instalat:</p>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        {job.products.map((prod: string, idx: number) => (
                                            <li key={idx} className="flex items-center">
                                                <CheckSquare className="w-3 h-3 mr-2 text-primary-500" />
                                                {prod}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <Link href={`/cont/instalator/job/${job.id}`} className="block bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center hover:bg-gray-100 transition-colors">
                                <span className="text-sm font-medium text-primary-600">Deschide Lucrarea</span>
                                <Briefcase className="w-5 h-5 text-primary-600" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
