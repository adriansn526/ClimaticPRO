'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle, XCircle, Clock, Truck, FileText, ChevronDown, Package } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface OrderItem {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    supplierData: any[];
}

interface Order {
    id: number;
    installerId: string;
    status: string;
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;
}

export default function B2BOrdersPage() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/orders');
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                showToast("Nu s-au putut încărca comenzile.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Eroare de conexiune.", "error");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Nouă</span>;
            case 'processing': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">În Procesare</span>;
            case 'sent_to_supplier': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">Trimisă Furnizor</span>;
            case 'completed': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Finalizată</span>;
            case 'cancelled': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">Anulată</span>;
            default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.installerId.includes(searchTerm)
    );

    // Send to Supplier
    const handleSendToSupplier = async (orderId: number) => {
        if (!confirm("Sigur doriți să trimiteți comanda la furnizori? Se vor genera PDF-uri și se vor trimite emailuri.")) {
            return;
        }

        try {
            showToast("Se procesează trimiterea...", "info");

            const res = await fetch('/api/b2b/orders/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            const data = await res.json();

            if (data.success) {
                showToast(`Comanda a fost trimisă cu succes! (${data.results.length} emailuri)`, "success");
                setSelectedOrder(null);
                fetchOrders(); // Refresh list
            } else {
                showToast(data.message || "Eroare la trimitere.", "error");
            }
        } catch (error) {
            console.error("Send Error:", error);
            showToast("Eroare de conexiune.", "error");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Comenzi B2B</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center shadow-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtrează
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                        Exportă Raport
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Comenzi Noi</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.filter(o => o.status === 'new').length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Valoare Totală</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()} RON</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                {/* Add more metrics as needed */}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Caută comandă (ID, Instalator)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">ID Comandă</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Instalator</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">Se încarcă...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nicio comandă găsită.</td></tr>
                        ) : filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-gray-600">#{order.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString('ro-RO')} <span className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{order.installerId}</div>
                                    {/* Ideally fetch installer name */}
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    {order.totalAmount} RON
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(order.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end ml-auto"
                                    >
                                        Detalii <ChevronDown className="w-4 h-4 ml-1" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Comanda #{selectedOrder.id}</h2>
                                <p className="text-sm text-gray-500">din {new Date(selectedOrder.createdAt).toLocaleDateString('ro-RO')}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Detalii Client (Instalator)</h3>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="font-bold text-gray-800">{selectedOrder.installerId}</p>
                                        <p className="text-sm text-gray-500">ID Utilizator</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Sumar Financiar</h3>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Comandă:</span>
                                        <span className="font-bold text-xl text-blue-600">{selectedOrder.totalAmount} RON</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Produse Comandate</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2">Produs</th>
                                            <th className="px-4 py-2 text-right">Preț</th>
                                            <th className="px-4 py-2 text-center">Cant.</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedOrder.items.map((item, idx) => {
                                            const hasSupplier = item.supplierData && item.supplierData.length > 0;
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                        {hasSupplier && (
                                                            <div className="flex gap-1 mt-1">
                                                                {item.supplierData.map((s: any, i: number) => (
                                                                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                                        Furnizor ID: {s.supplierId} - {s.price} RON
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{item.price} Lei</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium">{(item.price * item.quantity).toFixed(2)} Lei</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => handleSendToSupplier(selectedOrder.id)}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm flex items-center"
                                >
                                    <Truck className="w-4 h-4 mr-2" />
                                    Trimite la Furnizor
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">
                                    Marchează ca Finalizată
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
