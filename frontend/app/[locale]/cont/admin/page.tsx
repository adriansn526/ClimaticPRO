'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Package, Settings, BarChart, CheckCircle, XCircle, Search, Plus, LogOut, FileText } from 'lucide-react';

// MOCK DATA - STOCKS
const MOCK_STOCKS = [
    { id: '1', name: 'Kit Instalare 3m (Cu/Al)', qty: 50, unit: 'buc', price: 150 },
    { id: '2', name: 'Teava Cupru 1/4', qty: 200, unit: 'ml', price: 25 },
    { id: '3', name: 'Teava Cupru 3/8', qty: 180, unit: 'ml', price: 35 },
    { id: '4', name: 'Console L450', qty: 45, unit: 'per', price: 60 },
    { id: '5', name: 'Cablu 3x1.5', qty: 500, unit: 'ml', price: 5 },
];

// MOCK DATA - INSTALLERS
const MOCK_INSTALLERS = [
    { id: 'u1', name: 'Ion Popescu', email: 'ion@test.ro', phone: '0722123123', zone: 'Bucuresti Sec 6', status: 'approved', rating: 4.8 },
    { id: 'u2', name: 'Vasile Instal', email: 'vasile@firma.ro', phone: '0733444555', zone: 'Ilfov - Voluntari', status: 'pending', rating: 0 },
    { id: 'u3', name: 'Termo Expert SRL', email: 'contact@termo.ro', phone: '0744555666', zone: 'Bucuresti Sec 1', status: 'pending', rating: 0 },
];

export default function AdminPage() {
    const { user, isAdmin, isLoading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'stocks' | 'installers' | 'orders'>('orders'); // Default to orders for now

    const [stocks, setStocks] = useState(MOCK_STOCKS);
    const [installers, setInstallers] = useState(MOCK_INSTALLERS);
    const [orders, setOrders] = useState<any[]>([]);

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

    // Auth Redirect
    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push('/cont/login');
        }
    }, [isLoading, isAdmin, router]);

    if (isLoading || !isAdmin) return <div className="p-10 text-center">Verificare drepturi...</div>;

    // --- ACTIONS ---
    const updateStock = (id: string, newQty: number) => {
        setStocks(stocks.map(s => s.id === id ? { ...s, qty: newQty } : s));
    };

    const approveInstaller = (id: string) => {
        setInstallers(installers.map(i => i.id === id ? { ...i, status: 'approved' } : i));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                    <p className="text-xs text-gray-400 mt-1">Super Admin Control</p>
                </div>
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <BarChart className="w-5 h-5 mr-3" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <div className="relative mr-3">
                            <Search className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                        Comenzi Noi
                    </button>
                    <button
                        onClick={() => setActiveTab('stocks')}
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stocks' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Package className="w-5 h-5 mr-3" />
                        Gestiune Stocuri
                    </button>
                    <button
                        onClick={() => setActiveTab('installers')}
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'installers' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Instalatori
                    </button>
                    <Link
                        href="/cont/admin/comenzi-b2b"
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50`}
                    >
                        <FileText className="w-5 h-5 mr-3" />
                        Comenzi B2B (Mărfi)
                    </Link>
                    <button
                        className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                    >
                        <Settings className="w-5 h-5 mr-3" />
                        Setari (Soon)
                    </button>

                    <div className="pt-8 border-t border-gray-100 mt-4">
                        <button
                            onClick={logout}
                            className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Deconectare
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Nav Placeholder */}
            {/* ... Mobile nav to be added if needed ... */}

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">

                {/* 1. Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Sinteză Generală</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total Comenzi (Active)</p>
                                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Instalatori Activi</p>
                                <p className="text-3xl font-bold text-blue-600">{installers.filter(i => i.status === 'approved').length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Valoare Stoc</p>
                                <p className="text-3xl font-bold text-emerald-600">
                                    {stocks.reduce((acc, s) => acc + (s.qty * s.price), 0).toLocaleString()} RON
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Stocks Tab */}
                {activeTab === 'stocks' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Gestiune Materiale & Consumabile</h2>
                            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-primary-700">
                                <Plus className="w-4 h-4 mr-2" /> Adaugă Produs
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Produs / Material</th>
                                        <th className="p-4">UM</th>
                                        <th className="p-4">Preț (RON)</th>
                                        <th className="p-4">Stoc Actual</th>
                                        <th className="p-4 text-right">Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stocks.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{s.name}</td>
                                            <td className="p-4 text-gray-500 uppercase">{s.unit}</td>
                                            <td className="p-4">{s.price}</td>
                                            <td className="p-4 flex items-center max-w-[150px]">
                                                <button
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-gray-200 hover:bg-gray-300"
                                                    onClick={() => updateStock(s.id, Math.max(0, s.qty - 1))}
                                                >-</button>
                                                <span className={`mx-3 font-bold ${s.qty < 50 ? 'text-red-500' : 'text-gray-800'}`}>{s.qty}</span>
                                                <button
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-gray-200 hover:bg-gray-300"
                                                    onClick={() => updateStock(s.id, s.qty + 1)}
                                                >+</button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-primary-600 hover:underline text-xs">Editează</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {installer.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => approveInstaller(installer.id)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Aprobă
                                                </button>
                                                <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg flex items-center">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Respinge
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-right mr-4">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                                                <p className="text-lg font-bold text-amber-500">{installer.rating} / 5.0</p>
                                            </div>
                                        )}
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                            <Settings className="w-5 h-5" />
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
                        <h2 className="text-2xl font-bold text-gray-800">Dispecerat Comenzi</h2>

                        <div className="grid gap-4">
                            {orders.map(order => (
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
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 mt-1">
                                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {order.client}</span>
                                            <span className="flex items-center"><Search className="w-4 h-4 mr-1" /> {order.address}</span>
                                        </div>
                                        <div className="mt-2 text-xs font-semibold text-primary-600">
                                            Zona: {order.region} (3 Instalatori disponibili)
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
                                                <p className="text-xs text-gray-500">Se așteaptă acceptul...</p>
                                            </div>
                                        )}
                                        {order.status === 'assigned' && (
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-700 flex items-center justify-end">
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Alocat: {order.installer}
                                                </p>
                                                <button className="text-xs text-gray-400 hover:text-gray-600 mt-1">Vezi Detalii</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
