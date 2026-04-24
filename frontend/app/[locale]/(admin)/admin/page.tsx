'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Users, Package, Settings, BarChart, CheckCircle, XCircle, Search, Plus, LogOut, FileText, Megaphone, Share2, Star, Store, Send, Trash2, Pencil, Calendar, Link as LinkIcon } from 'lucide-react';
import SocialPlanner from '@/components/admin/marketing/SocialPlanner';
import AdminMarketingBanners from '@/components/admin/marketing/AdminMarketingBanners';
import AdminShortLinks from '@/components/admin/marketing/AdminShortLinks';
import AdminStocksView from '@/components/admin/AdminStocksView';
import InstallerDetailsModal from '@/components/admin/InstallerDetailsModal';
import JobDetailsDrawer from '@/components/admin/JobDetailsDrawer';

// No more MOCK_DATA, real data is fetched from /api/admin/installers

export default function AdminPage() {
    const { user, isAdmin, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const urlTab = searchParams.get('tab') as 'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing' | null;
    const initialTab = (urlTab && ['dashboard', 'stocks', 'installers', 'orders', 'marketing'].includes(urlTab)) ? urlTab : 'orders';

    const [activeTab, setActiveTabState] = useState<'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing'>(initialTab);

    // Sync state when URL params change externally
    useEffect(() => {
        if (urlTab && ['dashboard', 'stocks', 'installers', 'orders', 'marketing'].includes(urlTab) && urlTab !== activeTab) {
            setActiveTabState(urlTab);
        }
    }, [urlTab]);

    const setActiveTab = (tab: 'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing') => {
        setActiveTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Marketing Sub-Tabs
    const [activeMktTab, setActiveMktTabState] = useState<'sms' | 'social' | 'google' | 'promo' | 'shortlinks'>('sms');

    useEffect(() => {
        const storedMkt = localStorage.getItem('admin_activeMktTab');
        if (storedMkt && ['sms', 'social', 'google', 'promo', 'shortlinks'].includes(storedMkt)) {
            setActiveMktTabState(storedMkt as any);
        }
    }, []);

    const setActiveMktTab = (tab: 'sms' | 'social' | 'google' | 'promo' | 'shortlinks') => {
        setActiveMktTabState(tab);
        localStorage.setItem('admin_activeMktTab', tab);
    };
    const [smsAudienceCount, setSmsAudienceCount] = useState<number | null>(null);
    const [smsAudienceType, setSmsAudienceType] = useState<string>('toata_baza');
    const [smsAudienceParam, setSmsAudienceParam] = useState<string>('');

    // Manual Select State
    const [manualSearchQuery, setManualSearchQuery] = useState('');
    const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
    const [isSearchingManual, setIsSearchingManual] = useState(false);
    const [selectedManualClients, setSelectedManualClients] = useState<any[]>([]);

    useEffect(() => {
        if (smsAudienceType !== 'manual_selection' || manualSearchQuery.length < 3) {
            setManualSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            setIsSearchingManual(true);
            fetch(`/api/admin/marketing/sms/search?q=${encodeURIComponent(manualSearchQuery)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setManualSearchResults(data.results);
                    }
                })
                .catch(err => console.error("Search error", err))
                .finally(() => setIsSearchingManual(false));
        }, 500);

        return () => clearTimeout(timer);
    }, [manualSearchQuery, smsAudienceType]);

    // Update audienceParam when selected manual clients change
    useEffect(() => {
        if (smsAudienceType === 'manual_selection') {
            setSmsAudienceParam(JSON.stringify(selectedManualClients.map(c => c.id)));
        }
    }, [selectedManualClients, smsAudienceType]);

    // Google Reviews State
    const [googleReviewsConnected, setGoogleReviewsConnected] = useState(false);
    const [googleReviews, setGoogleReviews] = useState<any[]>([]);
    const [googleMetrics, setGoogleMetrics] = useState<any>({ averageRating: 0, totalReviewCount: 0 });
    const [googleReviewUrl, setGoogleReviewUrl] = useState('');
    const [googleDeliveryMethod, setGoogleDeliveryMethod] = useState('email');
    const [isSavingGoogle, setIsSavingGoogle] = useState(false);

    const handleSaveGoogleReviewsSettings = async () => {
        setIsSavingGoogle(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        GOOGLE_REVIEW_URL: googleReviewUrl,
                        REVIEW_DELIVERY_METHOD: googleDeliveryMethod
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Setările au fost salvate!');
            } else {
                alert('Eroare la salvare.');
            }
        } catch (error) {
            alert('Eroare la salvare.');
        } finally {
            setIsSavingGoogle(false);
        }
    };

    // Fetch dynamic audience count
    useEffect(() => {
        if (activeTab === 'marketing') {
            if (activeMktTab === 'sms') {
                const queryParams = new URLSearchParams({
                    type: smsAudienceType,
                    param: smsAudienceParam
                }).toString();
                fetch(`/api/admin/marketing/sms/count?${queryParams}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setSmsAudienceCount(data.count);
                        }
                    })
                    .catch(err => console.error("Error fetching audience count", err));
            } else if (activeMktTab === 'google') {
                fetch('/api/admin/marketing/google')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setGoogleReviewsConnected(data.account_connected);
                            setGoogleReviews(data.reviews || []);
                            setGoogleMetrics(data.metrics || { averageRating: 0, totalReviewCount: 0 });
                        }
                    })
                    .catch(err => console.error("Error fetching google reviews", err));

                fetch('/api/admin/settings')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.settings) {
                            setGoogleReviewUrl(data.settings.GOOGLE_REVIEW_URL || '');
                            setGoogleDeliveryMethod(data.settings.REVIEW_DELIVERY_METHOD || 'email');
                        }
                    })
                    .catch(err => console.error("Error fetching settings", err));
            }
        }
    }, [activeTab, activeMktTab, smsAudienceType, smsAudienceParam]);

    const [installers, setInstallers] = useState<any[]>([]);
    const [selectedInstallerId, setSelectedInstallerId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin || activeTab !== 'installers') return;
        fetch('/api/admin/installers')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setInstallers(data.installers);
                }
            })
            .catch(err => console.error("Error fetching admin installers", err));
    }, [isAdmin, activeTab]);
    const [orders, setOrders] = useState<any[]>([]);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [ordersSearch, setOrdersSearch] = useState('');
    const [ordersFilter, setOrdersFilter] = useState('toate'); // 'toate' | 'new' | 'assigned' | 'broadcasted'
    const [dashboardStats, setDashboardStats] = useState<any>(null);

    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAdmin || activeTab !== 'dashboard') return;
        fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDashboardStats(data);
                }
            })
            .catch(err => console.error("Error fetching admin dashboard stats", err));
    }, [isAdmin, activeTab]);
    // Fetch Orders
    useEffect(() => {
        if (!isAdmin) return;

        async function fetchOrders() {
            try {
                const res = await fetch('/api/dispatch/orders?role=admin');
                const data = await res.json();
                if (data.success) {
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error('Failed to fetch orders', error);
            }
        }
        fetchOrders();

        // Poll every 30s
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    // --- ACTIONS ---
    const broadcastOrder = async (id: string) => {
        // Optimistic UI Update
        setOrders(orders.map(o => o.id === id ? { ...o, status: 'broadcasted' } : o));

        // API Call
        try {
            const order = orders.find(o => o.id === id);
            await fetch('/api/dispatch/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: id,
                    action: 'broadcast',
                    region: order?.region || 'Bucuresti'
                })
            });
        } catch (e) {
            console.error('Broadcast failed', e);
            // Revert on error if needed
        }
    };

    const deleteOrder = async (id: string) => {
        if (!confirm('Ești sigur că vrei să ștergi definitiv această cerere de montaj/comandă? Această acțiune nu poate fi revocată.')) return;
        
        const original = [...orders];
        setOrders(orders.filter(o => o.id !== id));

        try {
            const res = await fetch(`/api/dispatch/orders?orderId=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare la ștergere: ' + data.error);
                setOrders(original);
            }
        } catch (e) {
            console.error('Failed to delete order', e);
            setOrders(original);
        }
    };

    const updateOrderDetails = async (e: React.FormEvent, id: string) => {
        e.preventDefault();
        const updatedData = {
            clientName: editingOrder.client,
            phone: editingOrder.phone,
            address: editingOrder.address,
            newRegion: editingOrder.region
        };

        const original = [...orders];
        setOrders(orders.map(o => o.id === id ? { ...o, client: updatedData.clientName, phone: updatedData.phone, address: updatedData.address, region: updatedData.newRegion } : o));
        setEditingOrder(null);

        try {
            const res = await fetch('/api/dispatch/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: id,
                    action: 'update_details',
                    ...updatedData
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare la salvare: ' + data.error);
                setOrders(original);
            }
        } catch (err) {
            console.error('Failed to update order', err);
            setOrders(original);
        }
    };

    // Auth Redirect
    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push('/cont/login');
        }
    }, [isLoading, isAdmin, router]);

    if (isLoading || !isAdmin) return <div className="p-10 text-center">Verificare drepturi...</div>;

    // --- ACTIONS ---
    const toggleAutoAssign = async (id: string, currentValue: boolean) => {
        const newValue = !currentValue;
        const original = [...installers];
        
        setInstallers(installers.map(i => {
            if (i.id === id) return { ...i, isAutoAssignEnabled: newValue };
            if (newValue) return { ...i, isAutoAssignEnabled: false };
            return i;
        }));

        try {
            const res = await fetch('/api/admin/installers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installerId: id, action: 'toggle_auto_assign', value: newValue })
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare: ' + data.error);
                setInstallers(original);
            }
        } catch (e) {
            console.error('Eroare auto-assign', e);
            setInstallers(original);
        }
    };

    const toggleInternalStatus = async (id: string, currentValue: boolean) => {
        const newValue = !currentValue;
        const original = [...installers];
        setInstallers(installers.map(i => i.id === id ? { ...i, isInternal: newValue } : i));
        
        try {
            const res = await fetch('/api/admin/installers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installerId: id, action: 'toggle_internal', value: newValue })
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare: ' + data.error);
                setInstallers(original);
            }
        } catch (e) {
            console.error('Failed to toggle internal status', e);
            setInstallers(original);
        }
    };

    const updateCapacity = async (id: string, newCapacity: number) => {
        const original = [...installers];
        setInstallers(installers.map(i => i.id === id ? { ...i, dailyCapacity: newCapacity } : i));
        
        try {
            const res = await fetch('/api/admin/installers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installerId: id, action: 'update_capacity', value: newCapacity })
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare: ' + data.error);
                setInstallers(original);
            }
        } catch (e) {
            console.error('Failed to update capacity', e);
            setInstallers(original);
        }
    };

    const updateInstallerStatus = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
        // Optimistic update
        const original = [...installers];
        const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
        setInstallers(installers.map(i => i.id === id ? { ...i, status: newStatus } : i));

        try {
            const res = await fetch('/api/admin/installers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installerId: id, action })
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare: ' + data.error);
                setInstallers(original);
            }
        } catch (e) {
            console.error('Failed to update installer status', e);
            setInstallers(original);
        }
    };

    const deleteInstaller = async (id: string, name: string) => {
        if (!confirm(`Ești sigur că vrei să ștergi definitiv instalatorul ${name}? Această acțiune este ireversibilă și va șterge tot istoricul asociat.`)) return;
        
        const original = [...installers];
        setInstallers(installers.filter(i => i.id !== id));

        try {
            const res = await fetch(`/api/admin/installers/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!data.success) {
                alert('Eroare la ștergere: ' + data.error);
                setInstallers(original);
            }
        } catch (e) {
            console.error('Failed to delete installer', e);
            setInstallers(original);
        }
    };
    
    const filteredOrders = orders.filter(o => {
        // Status filter
        if (ordersFilter === 'new' && o.status !== 'new') return false;
        if (ordersFilter === 'assigned' && o.status !== 'assigned') return false;
        if (ordersFilter === 'broadcasted' && o.status !== 'broadcasted') return false;

        // Search filter
        if (ordersSearch) {
            const searchLower = ordersSearch.toLowerCase();
            const matchesId = o.id?.toString().includes(searchLower);
            const matchesClient = o.client?.toLowerCase().includes(searchLower);
            const matchesPhone = o.phone?.toLowerCase().includes(searchLower);
            const matchesRegion = o.region?.toLowerCase().includes(searchLower);
            const matchesAddress = o.address?.toLowerCase().includes(searchLower);
            
            if (!matchesId && !matchesClient && !matchesPhone && !matchesRegion && !matchesAddress) {
                return false;
            }
        }
        
        return true;
    });

    return (
        <div className="flex-1 p-8 overflow-y-auto">

            {/* 1. Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-slate-900 p-8 rounded-2xl shadow-xl border border-blue-800/50 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white tracking-tight">Panou de Comandă ClimaticPRO</h2>
                            <p className="text-blue-200 mt-2 font-medium max-w-lg">Rapoarte globale în timp real despre echipa ta și dinamica financiară B2B.</p>
                        </div>
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 text-white/5">
                            <BarChart className="w-64 h-64" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText className="w-16 h-16 text-emerald-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Încasări B2B</p>
                            <p className="text-3xl font-black text-emerald-600">
                                {dashboardStats ? new Intl.NumberFormat('ro-RO').format(dashboardStats.totalB2BSales || 0) : '...'} <span className="text-xl">RON</span>
                            </p>
                            <p className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Total comenzi de la echipe</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Search className="w-16 h-16 text-blue-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Dispecerat Nou</p>
                            <p className="text-3xl font-black text-blue-600">
                                {orders.filter(o => o.status === 'new').length}
                            </p>
                            <p className="text-xs font-semibold text-blue-700 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">Montaje nealocate</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Package className="w-16 h-16 text-orange-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Total Comenzi</p>
                            <p className="text-3xl font-black text-gray-900">
                                {orders.length}
                            </p>
                            <p className="text-xs font-semibold text-gray-500 mt-2 bg-gray-100 inline-block px-2 py-1 rounded">Active pe ultimele luni</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16 text-indigo-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Instalatori Activi</p>
                            <p className="text-3xl font-black text-indigo-600">
                                {dashboardStats ? dashboardStats.activeInstallersCount : installers.filter(i => i.status === 'approved').length}
                            </p>
                            {dashboardStats?.pendingInstallersCount > 0 && (
                                <p className="text-xs font-bold text-orange-700 mt-2 bg-orange-50 inline-block px-2 py-1 rounded">
                                    + {dashboardStats.pendingInstallersCount} în așteptare
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Store className="w-6 h-6 text-gray-400" />
                            Ultimele Comenzi B2B (Echipe pe Teren)
                        </h3>
                        {dashboardStats && dashboardStats.latestB2BOrders ? (
                            <div className="space-y-4">
                                {dashboardStats.latestB2BOrders.map((activity: any) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{activity.title}</p>
                                                <p className="text-xs font-semibold text-gray-500 mt-0.5">Autor: {activity.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-mono text-gray-400">{new Date(activity.date).toLocaleString('ro-RO')}</p>
                                        </div>
                                    </div>
                                ))}
                                {dashboardStats.latestB2BOrders.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">Nu există activitate recentă.</p>
                                )}
                            </div>
                        ) : (
                            <div className="animate-pulse flex flex-col gap-4">
                                {[1,2,3].map((v) => <div key={v} className="h-16 bg-gray-100 rounded-xl w-full"></div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Stocks Tab */}
            {activeTab === 'stocks' && (
                <AdminStocksView />
            )}

            {/* 3. Installers Tab */}
            {activeTab === 'installers' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Administrare Instalatori</h2>

                    <div className="space-y-4">
                        {installers.map(installer => (
                            <div key={installer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between">
                                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${installer.status === 'approved' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                                        {installer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{installer.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{installer.email}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{installer.phone}</span>
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                Zona: {installer.zone}
                                            </span>
                                            {installer.status === 'pending' && (
                                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 font-bold uppercase">
                                                    În așteptare
                                                </span>
                                            )}
                                            {installer.status === 'approved' && (
                                                <div className="flex flex-col gap-1 ml-2">
                                                    <label className="flex items-center gap-1 cursor-pointer bg-gray-50 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
                                                            checked={!!installer.isAutoAssignEnabled} 
                                                            onChange={() => toggleAutoAssign(installer.id, !!installer.isAutoAssignEnabled)} 
                                                        />
                                                        <span className="text-xs font-bold text-gray-700">Auto-Assign Comenzi</span>
                                                    </label>
                                                    
                                                    <label className="flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
                                                            checked={!!installer.isInternal} 
                                                            onChange={() => toggleInternalStatus(installer.id, !!installer.isInternal)} 
                                                        />
                                                        <span className="text-xs font-bold text-blue-800">Instalator Intern (Manuale)</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {installer.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => updateInstallerStatus(installer.id, 'approve')}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Aprobă
                                            </button>
                                            <button
                                                onClick={() => updateInstallerStatus(installer.id, 'reject')}
                                                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg flex items-center"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Respinge
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-6 mr-4">
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold text-center mb-1">Capacitate/Zi</p>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="50"
                                                    disabled={installer.status !== 'approved'}
                                                    value={installer.dailyCapacity ?? 3} 
                                                    onChange={(e) => {
                                                        const newVal = parseInt(e.target.value);
                                                        setInstallers(installers.map(i => i.id === installer.id ? { ...i, dailyCapacity: isNaN(newVal) ? 0 : newVal } : i));
                                                    }}
                                                    onBlur={(e) => {
                                                        const newVal = parseInt(e.target.value);
                                                        if (!isNaN(newVal)) updateCapacity(installer.id, newVal);
                                                    }}
                                                    className="w-16 border border-gray-300 rounded-md text-center py-1 font-bold text-blue-700 bg-gray-50"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                                                <p className="text-lg font-bold text-amber-500">{installer.rating} / 5.0</p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setSelectedInstallerId(installer.id)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteInstaller(installer.id, installer.name)}
                                        className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition-colors ml-1"
                                        title="Șterge Instalator"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Orders Dispatch Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Dispecerat Comenzi</h2>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                            Total: {orders.length} / Noi: {orders.filter(o => o.status === 'new').length}
                        </span>
                    </div>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <Package className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Nu există nicio comandă</h3>
                            <p className="text-gray-500 max-w-md mx-auto">În acest moment nu sunt comenzi recente în sistem. Comenzile plasate de clienți vor apărea aici automat.</p>
                        </div>
                    ) : (
                        <>
                            {orders.filter(o => o.status === 'new').length === 0 && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-6 flex items-start gap-4 shadow-sm mb-6">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500 shrink-0">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-800 mb-1">Ești la zi! Nu ai comenzi noi.</h3>
                                        <p className="text-emerald-700 text-sm">Toate comenzile recente au fost deja direcționate spre instalatori. Listate mai jos sunt comenzile în curs de procesare sau deja alocate.</p>
                                    </div>
                                </div>
                            )}

                            {/* Search & Filter Toolbar */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {['toate', 'new', 'broadcasted', 'assigned'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setOrdersFilter(f)}
                                            className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-colors ${ordersFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                        >
                                            {f === 'toate' ? 'Toate' : f === 'new' ? 'Noi' : f === 'broadcasted' ? 'În Așteptare' : 'Alocate'}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        placeholder="Caută client, ID, telefon..."
                                        value={ordersSearch}
                                        onChange={(e) => setOrdersSearch(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid gap-4">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center p-8 bg-gray-50 border border-gray-100 rounded-xl text-gray-500">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Nu am găsit nicio comandă care să se potrivească filtrelor tale.</p>
                            </div>
                        ) : filteredOrders.map(order => (
                            <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between lg:items-center">
                                <div className="mb-4 lg:mb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${order.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'broadcasted' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {order.status === 'new' ? 'Comandă Nouă' :
                                                order.status === 'broadcasted' ? 'Caută Instalator...' : 'Alocată'}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">#{order.id}</span>
                                        <span className="text-xs text-gray-400">{order.date}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">{order.product}</h3>
                                    {order.appointmentDate && order.appointmentDate !== 'Neprogramat' && (
                                        <div className="flex items-center text-sm font-semibold text-emerald-700 mt-2 mb-1 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            Programare: {order.appointmentDate}
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 mt-1">
                                        <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {order.client}</span>
                                        <span className="flex items-center"><Search className="w-4 h-4 mr-1" /> {order.address}</span>
                                    </div>
                                    <div className="mt-2 text-xs font-semibold text-primary-600">
                                        Zona: {order.region}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {order.status === 'new' && (
                                        <button
                                            onClick={() => broadcastOrder(order.id)}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center shadow-sm hover:shadow transition-all"
                                        >
                                            <div className="relative mr-2">
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                                                <Search className="w-4 h-4" />
                                            </div>
                                            Caută Instalator ({order.region})
                                        </button>
                                    )}
                                    {order.status === 'broadcasted' && (
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-800">Notificare trimisă</p>
                                            {order._targetedInstaller ? (
                                                 <p className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-block mt-1 mb-1">
                                                    {order.installer}
                                                 </p>
                                            ) : (
                                                 <p className="text-xs font-bold text-yellow-600 mt-1 mb-1">
                                                    (Către toată rețeaua)
                                                 </p>
                                            )}
                                            <p className="text-xs text-gray-500">Se așteaptă acceptul...</p>
                                        </div>
                                    )}
                                    {order.status === 'assigned' && (
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-700 flex items-center justify-end">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Alocat: {order.installer}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="text-right ml-4">
                                        <button 
                                            onClick={() => setSelectedJobId(order.id)} 
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                                        >
                                            Vezi Detalii
                                        </button>
                                    </div>

                                    {/* Action Utilities (CRUD) */}
                                    <div className="flex items-center gap-1 border-l pl-3 ml-2 border-gray-100 h-full">
                                        <button onClick={() => setEditingOrder(order)} title="Modifică Detalii" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => deleteOrder(order.id)} title="Șterge Comanda" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                        </>
                    )}

                    {/* Edit Order Modal */}
                    {editingOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="text-xl font-bold text-gray-900">Modifică Comanda #{editingOrder.id}</h3>
                                    <button onClick={() => setEditingOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={(e) => updateOrderDetails(e, editingOrder.id)}>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nume Client</label>
                                            <input type="text" required value={editingOrder.client} onChange={e => setEditingOrder({...editingOrder, client: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                                            <input type="text" required value={editingOrder.phone} onChange={e => setEditingOrder({...editingOrder, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Adresă (Strada, Oraș)</label>
                                            <input type="text" required value={editingOrder.address} onChange={e => setEditingOrder({...editingOrder, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Județ / Zonă Deservire (ex: Bucuresti, Ilfov, Cluj)</label>
                                            <input type="text" required value={editingOrder.region} onChange={e => setEditingOrder({...editingOrder, region: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 p-3 rounded-lg bg-gray-50 border border-gray-200">
                                                <Package className="w-4 h-4 text-gray-400" />
                                                <strong>Produs / Serviciu:</strong> Produsul nu se editează din dispecerat direct pentru a nu afecta logica B2B/B2C originală WooCommerce. Editați-l din modulul WooCommerce standard dacă este absolut necesar modificarea prețului unitar.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                        <button type="button" onClick={() => setEditingOrder(null)} className="px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                                            Renunță
                                        </button>
                                        <button type="submit" className="px-5 py-2.5 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer">
                                            Salvează Modificările
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 5. Marketing Hub Tab */}
            {activeTab === 'marketing' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-2 mb-6">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-orange-600" />
                            Marketing Hub
                        </h2>
                        <p className="text-gray-500">Gestionează toate canalele de promovare ClimaticPRO dintr-un singur loc.</p>
                    </div>

                    {/* Sub-Tabs Nav */}
                    <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
                        {[
                            { id: 'sms', label: 'Campanii SMS', icon: Send },
                            { id: 'social', label: 'Social Media', icon: Share2 },
                            { id: 'google', label: 'Google Recenzii', icon: Star },
                            { id: 'promo', label: 'Promo Site', icon: Store },
                            { id: 'shortlinks', label: 'Link-uri Scurte', icon: LinkIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveMktTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${activeMktTab === tab.id
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="pt-4 pb-12">
                        {/* --- TAB 1: SMS --- */}
                        {activeMktTab === 'sms' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Send className="w-5 h-5 text-orange-500" />
                                            Audiență Campanii (Export Automat)
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Bazat pe istoricul din WooCommerce. Clienții recurenți sunt deduplicați automat intern de platformă la fiecare export.
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0 text-right bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <p className="text-3xl font-bold text-orange-600">
                                            {smsAudienceCount !== null ? smsAudienceCount : '...'}
                                        </p>
                                        <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Contacte E.164 (+40)</p>
                                    </div>
                                </div>

                                <form className="space-y-6" onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const messageStr = formData.get('message') as string;
                                    const senderId = formData.get('sender') as string;

                                    if (!messageStr || messageStr.length < 10) {
                                        alert("Mesajul este prea scurt. Minim 10 caractere.");
                                        return;
                                    }

                                    if (!confirm(`Ești sigur că vrei să trimiți acest SMS catre ${smsAudienceCount || '...'} de clienți?\nProcesul va consuma credite din contul extern SMSO.\n\nAceastă acțiune este direct ireversibilă.`)) return;

                                    const btn = document.getElementById('sms-submit-btn');
                                    if (btn) btn.innerHTML = 'Se trimite (Nu închide fereastra)...';
                                    if (btn) btn.setAttribute('disabled', 'true');

                                    try {
                                        const res = await fetch('/api/admin/marketing/sms', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: messageStr,
                                                senderId,
                                                audienceType: smsAudienceType,
                                                audienceParam: smsAudienceParam
                                            })
                                        });
                                        const data = await res.json();

                                        if (data.success) {
                                            alert("SUCCES!\n\n" + data.message);
                                        } else {
                                            alert('Eroare: ' + data.error);
                                        }
                                    } catch (error) {
                                        alert('Eroare rețea/server');
                                    } finally {
                                        if (btn) btn.innerHTML = 'Trimite Campanie ACUM';
                                        if (btn) btn.removeAttribute('disabled');
                                    }
                                }}>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                        <label className="block text-sm font-bold text-gray-900 mb-3">Segmentare Audiență (Targetare)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                    value={smsAudienceType}
                                                    onChange={(e) => setSmsAudienceType(e.target.value)}
                                                >
                                                    <option value="toata_baza">Toată Baza (Istoric Complet)</option>
                                                    <option value="manual_selection">Clienți Selectați Manual (Caută)</option>
                                                    <option value="individual">Număr Individual (Test/Client Specific)</option>
                                                    <option value="montaj_inclus">Clienți cu Montaj Inclus</option>
                                                    <option value="b2b">Clienți B2B (Pe Firmă)</option>
                                                    <option value="recent">Clienți Recenți (Ultimele 30 zile)</option>
                                                    <option value="vechi">Clienți Vechi (Peste 1 an)</option>
                                                    <option value="geografic">Geografic (Județ)</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-2">Alege filtrul dorit. Numărul audienței estimate (sus-dreapta) se va actualiza.</p>
                                            </div>

                                            {smsAudienceType === 'individual' && (
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: 0722123456"
                                                        value={smsAudienceParam}
                                                        onChange={(e) => setSmsAudienceParam(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                    />
                                                </div>
                                            )}

                                            {smsAudienceType === 'manual_selection' && (
                                                <div className="md:col-span-2 mt-4 space-y-3">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                                        <input
                                                            type="text"
                                                            placeholder="Caută după Nume Client sau Telefon (min. 3 caractere)..."
                                                            value={manualSearchQuery}
                                                            onChange={(e) => setManualSearchQuery(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                                        />
                                                        {isSearchingManual && (
                                                            <div className="absolute right-3 top-3">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {manualSearchResults.length > 0 && (
                                                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg shadow-sm bg-white divide-y divide-gray-100">
                                                            {manualSearchResults.map(client => (
                                                                <button
                                                                    key={client.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!selectedManualClients.find(c => c.id === client.id)) {
                                                                            setSelectedManualClients([...selectedManualClients, client]);
                                                                        }
                                                                        setManualSearchQuery('');
                                                                    }}
                                                                    className="w-full hover:bg-blue-50 p-3 text-left flex justify-between items-center transition-colors"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-gray-800">{client.nume_client}</span>
                                                                        <span className="text-xs text-gray-500">📞 {client.phone} • {client.city}</span>
                                                                    </div>
                                                                    <div className="flex flex-col text-right">
                                                                        <span className="text-xs font-semibold text-blue-600">{client.nume_aparat}</span>
                                                                        <span className="text-xs text-gray-500">Achiziție: {client.data_comenzii}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedManualClients.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {selectedManualClients.map(client => (
                                                                <div key={client.id} className="flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                                                    <span>{client.nume_client}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedManualClients(selectedManualClients.filter(c => c.id !== client.id))}
                                                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                                                    >
                                                                        <XCircle className="w-4 h-4 text-blue-600" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {smsAudienceType === 'geografic' && (
                                                <div>
                                                    <select
                                                        value={smsAudienceParam}
                                                        onChange={(e) => setSmsAudienceParam(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                    >
                                                        <option value="">-- Alege Județ --</option>
                                                        <option value="Bucuresti">București</option>
                                                        <option value="Ilfov">Ilfov</option>
                                                        <option value="Cluj">Cluj</option>
                                                        <option value="Timis">Timiș</option>
                                                        <option value="Iasi">Iași</option>
                                                        <option value="Constanta">Constanța</option>
                                                        <option value="Brasov">Brașov</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sender ID (Expeditor validat SMSO)</label>
                                        <input
                                            type="text"
                                            name="sender"
                                            placeholder="ClimaticPRO"
                                            defaultValue="ClimaticPRO"
                                            className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Expeditorul trebuie aprobat manual din platforma SMSO. Lasă gol pt Default.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Corp Mesaj SMS</label>
                                        <p className="text-xs text-indigo-600 mb-2 font-semibold">Shortcodes: <code className="bg-indigo-50 px-1 py-0.5 rounded">{`{nume_client}`}</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded">{`{data_comenzii}`}</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded">{`{nume_aparat}`}</code></p>
                                        <textarea
                                            name="message"
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none font-medium text-gray-800"
                                            placeholder="Salutare {nume_client}! In data de {data_comenzii} ati cumparat {nume_aparat}. Nu uita sa programezi mentenanta!"
                                            maxLength={320}
                                            onChange={(e) => {
                                                const indic = document.getElementById('char-count');
                                                if (indic) indic.innerText = e.target.value.length.toString();
                                            }}
                                        ></textarea>
                                        <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <span>Cost estimat: SMSO taxează la format extins (2+ SMS)</span>
                                            <span className="text-gray-500"><span id="char-count">0</span> / 320 Caractere (Limită Extinsă pt Shortcodes)</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <a href="/api/admin/marketing/download" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline transition-colors">
                                            ↓ Descărcați lista Excel (CSV Backup)
                                        </a>
                                        <button
                                            id="sms-submit-btn"
                                            type="submit"
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Trimite Campanie ACUM
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* --- TAB 2: SOCIAL --- */}
                        {activeMktTab === 'social' && (
                            <SocialPlanner />
                        )}

                        {/* --- TAB 3: GOOGLE REVIEW --- */}
                        {activeMktTab === 'google' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <Star className="text-yellow-500 fill-yellow-500 w-6 h-6" />
                                                Automatizare Recenzii Google
                                            </h3>
                                            <p className="text-gray-600 mb-6">Trimițând un review prin SMS automat după ce o lucrare este marcată „Finalizată”, îți poți crește reputația online rapid.</p>

                                            <div className="space-y-4 max-w-lg">
                                                {!googleReviewsConnected && (
                                                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-start gap-3">
                                                        <div className="mt-0.5">⚠️</div>
                                                        <div>
                                                            <h4 className="font-bold text-sm">Autentificare Necesară</h4>
                                                            <p className="text-xs mt-1">Acest modul necesită conectarea cu API-ul Google My Business prin Service Account pentru a citi și răspunde la recenzii direct de aici.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Link Către Profilul Google</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="https://g.page/r/your-id/review" 
                                                        className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-yellow-500" 
                                                        value={googleReviewUrl}
                                                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Metodă de Livrare</label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
                                                        value={googleDeliveryMethod}
                                                        onChange={(e) => setGoogleDeliveryMethod(e.target.value)}
                                                    >
                                                        <option value="email">Doar Email</option>
                                                        <option value="sms">Doar SMS (SMSO)</option>
                                                        <option value="both">Ambele (Email + SMS)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Șablon Mesaj SMS (Trimis Automat)</label>
                                                    <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-sm text-gray-600" disabled value="Bună {Client}! Montajul sistemului tău a fost finalizat. Ne-ar plăcea să ne lași o recenzie rapidă aici: {Google_Link}. Mulțumim, echipa ClimaticPRO!"></textarea>
                                                </div>
                                                <button
                                                    onClick={handleSaveGoogleReviewsSettings}
                                                    disabled={isSavingGoogle}
                                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors text-sm"
                                                >
                                                    {isSavingGoogle ? 'Se salvează...' : 'Salvează Setările'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 w-full lg:w-72 text-center">
                                            <div className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{googleMetrics.averageRating}</div>
                                            <div className="flex justify-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className={`w-5 h-5 ${star <= Math.round(googleMetrics.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">{googleMetrics.totalReviewCount} Recenzii Google</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista Recenzii */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900">Ultimele Recenzii</h4>
                                        {!googleReviewsConnected && <span className="text-xs font-bold px-2 py-1 bg-gray-200 text-gray-600 rounded">Mod Simulat (Date Test)</span>}
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {googleReviews.length > 0 ? googleReviews.map((review: any) => (
                                            <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900">{review.reviewer_name}</div>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                            <span className="text-xs text-gray-500 ml-2">{new Date(review.createTime).toLocaleDateString('ro-RO')}</span>
                                                        </div>
                                                    </div>
                                                    {!review.reply && (
                                                        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                                            Răspunde
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 mt-3">{review.comment}</p>
                                                {review.reply && (
                                                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                                        <p className="text-xs font-bold text-gray-800">Răspunsul tău:</p>
                                                        <p className="text-sm text-gray-600 italic mt-1">{review.reply.comment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-gray-500">Nu există recenzii extrase încă.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* --- TAB 4: Promo --- */}
                        {activeMktTab === 'promo' && (
                            <AdminMarketingBanners />
                        )}

                        {/* --- TAB 5: ShortLinks --- */}
                        {activeMktTab === 'shortlinks' && (
                            <AdminShortLinks />
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedInstallerId && (
                <InstallerDetailsModal
                    installerId={selectedInstallerId}
                    onClose={() => setSelectedInstallerId(null)}
                />
            )}

            {/* View Details Drawer */}
            <JobDetailsDrawer 
                orderId={selectedJobId} 
                isOpen={selectedJobId !== null} 
                onClose={() => setSelectedJobId(null)} 
            />
        </div>
    );
}

