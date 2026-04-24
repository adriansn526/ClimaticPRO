'use client';

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type OrderItem = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
};

type B2BOrder = {
    id: number;
    totalAmount: number;
    status: string;
    installerId: string;
    deliveryAddress: string | null;
    contactPhone: string | null;
    jobId: number | null;
    notes: string | null;
    createdAt: string;
    items: OrderItem[];
    authorName: string | null;
    authorPhone: string | null;
    documentUrls?: any | null;
    installerProfile?: {
        userId: string;
        companyName: string | null;
        name: string | null;
        phone: string | null;
    } | null;
};

export default function AdminB2BOrdersTable() {
    const [orders, setOrders] = useState<B2BOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<B2BOrder | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/b2b-orders');
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const res = await fetch('/api/admin/b2b-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status }),
            });
            const data = await res.json();
            if (data.success) {
                // Optimistically update the list
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
                
                // Also update the selected order if it's open
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status } : null);
                }

                showToast(data.message || 'Status actualizat cu succes.', 'success');
            } else {
                showToast(data.message || 'Eroare la actualizare', 'error');
            }
        } catch (error) {
            console.error('Failed to update status', error);
            showToast('Eroare de rețea. Vă rugăm să reîncercați.', 'error');
        }
    };

    const deleteOrder = async (orderId: number) => {
        if (!confirm('Ești sigur că vrei să ștergi definitiv această comandă B2B?')) return;
        
        try {
            const res = await fetch(`/api/admin/b2b-orders?orderId=${orderId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (data.success) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                showToast(data.message || 'Comanda a fost ștearsă.', 'success');
            } else {
                showToast(data.message || 'Eroare la ștergere.', 'error');
            }
        } catch (error) {
            console.error('Failed to delete B2B order', error);
            showToast('Eroare de rețea. Nu s-a putut șterge.', 'error');
        }
    };

    const sendPushNotification = async (orderId: number) => {
        try {
            const res = await fetch(`/api/admin/b2b-orders/${orderId}/send-push`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, 'success');
            } else {
                showToast(data.message || 'Eroare la trimiterea notificării.', 'error');
            }
        } catch (err) {
            showToast('Eroare de conexiune la trimitere Push.', 'error');
        }
    };

    const openPdfPreview = async (order: B2BOrder) => {
        setPreviewLoading(true);
        setPreviewUrl('loading');
        try {
            const res = await fetch(`/api/admin/b2b-orders/${order.id}/invoice`, { method: 'POST' });
            const data = await res.json();
            if (data.success && data.url) {
                setPreviewUrl(data.url);
            } else {
                showToast(data.message || 'Eroare la generare PDF', 'error');
                setPreviewUrl(null);
            }
        } catch (e) {
            showToast('Eroare rețea', 'error');
            setPreviewUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const getStyle = () => {
            switch (status) {
                case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
                case 'canceled': return 'bg-red-100 text-red-800 border-red-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200'; // includes 'new'
            }
        };
        const getLabel = () => {
            switch (status) {
                case 'new': return 'Nouă';
                case 'processing': return 'În Procesare';
                case 'shipped': return 'Expediată';
                case 'delivered': return 'Livrată';
                case 'canceled': return 'Anulată';
                default: return status;
            }
        }
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStyle()}`}>
                {getLabel()}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Se încarcă comenzile...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID / Dată</th>
                            <th className="px-6 py-4">Instalator</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Adresă Livrare</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nu aveți comenzi B2B.</td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">#{order.id}</div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        {new Date(order.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 mb-1 leading-tight">
                                        <span className="text-xs text-blue-600 font-bold block mb-0.5">Plasată de: {order.authorName || 'Echipa Principală'}</span>
                                        <span className="text-sm">{order.installerProfile?.companyName || 'Instalator'}</span>
                                    </div>
                                    <div className="text-gray-500 text-xs font-medium">{order.authorPhone || order.installerProfile?.phone || `ID: ${order.installerId}`}</div>
                                    {order.installerProfile?.phone && (
                                        <a href={`tel:${order.installerProfile.phone}`} className="text-blue-600 hover:text-blue-800 text-xs mt-1 block font-medium">
                                            {order.installerProfile.phone}
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-emerald-600">{Number(order.totalAmount).toFixed(2)} RON</span>
                                    <div className="text-xs text-gray-500 mt-1">{order.items?.length || 0} iteme</div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="truncate text-gray-800 font-medium">{order.deliveryAddress || 'Nespecificat'}</div>
                                    {order.jobId && <div className="text-xs text-blue-600 font-semibold mt-1">Șantier ID: #{order.jobId}</div>}
                                    {order.contactPhone && <div className="text-xs text-gray-500 mt-1">Tel: {order.contactPhone}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        Vezi
                                    </button>
                                    <button 
                                        onClick={() => deleteOrder(order.id)}
                                        title="Șterge Comanda"
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Visualizer Modal for JSON Items */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Comandă B2B #{selectedOrder.id}</h2>
                                <div className="text-gray-500 text-sm mt-1">
                                    Plasată la {new Date(selectedOrder.createdAt).toLocaleString('ro-RO')}
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-2 rounded-lg border border-gray-200">
                                ✕ închide
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">Detalii Livrare</h3>
                                    <p className="font-semibold text-gray-900">{selectedOrder.deliveryAddress || 'Nescris'}</p>
                                    <p className="text-gray-600 text-sm mt-1">Tel: {selectedOrder.contactPhone}</p>
                                    {selectedOrder.jobId && (
                                        <div className="mt-3 inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                            Șantier Asociat #{selectedOrder.jobId}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                    <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3">Note Instalator</h3>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap italic">
                                        {selectedOrder.notes || 'Nu există observații suplimentare la comandă.'}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Produse Solicitate ({selectedOrder.items?.length || 0})</h3>
                            <div className="space-y-4">
                                {selectedOrder.items?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/30 items-center">
                                        <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-300 text-xs text-center">Fără Poză</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">ID Produs: {item.productId}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">{item.quantity} x {Number(item.price).toFixed(2)}</div>
                                            <div className="text-xs text-gray-500 mt-1 font-medium">Subtotal: {(item.quantity * item.price).toFixed(2)} RON</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden items-center group">
                                <select 
                                    className="text-sm border-none bg-transparent font-semibold text-gray-700 outline-none pr-8 py-2.5 px-4 cursor-pointer focus:ring-0"
                                    value={selectedOrder.status}
                                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                                >
                                    <option value="new">Nouă (În așteptare)</option>
                                    <option value="processing">În Procesare</option>
                                    <option value="shipped">Expediată / Prelată Curier</option>
                                    <option value="delivered">Livrată (Finalizată)</option>
                                    <option value="canceled">Anulată</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => openPdfPreview(selectedOrder)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors border border-indigo-200/50 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {(selectedOrder.status === 'new' || selectedOrder.status === 'processing') ? 'Generare Proformă' : 'Generare Factură Fiscală'} (Preview)
                                </button>

                                <div className="text-right border-l border-gray-200 pl-4">
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Total Platit</div>
                                    <div className="text-xl font-black text-emerald-600 tracking-tight leading-none">{Number(selectedOrder.totalAmount).toFixed(2)} RON</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewUrl && selectedOrder && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-gray-900">Previzualizare Document PDF</h2>
                                <button 
                                    onClick={() => {
                                        sendPushNotification(selectedOrder.id);
                                    }}
                                    disabled={previewLoading || previewUrl === 'loading'}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-lg transition-transform hover:scale-105 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Trimite Document Către Client (Pe Mobil)
                                </button>
                            </div>
                            <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-red-600 bg-white shadow-sm p-2 rounded-lg border border-gray-200 transition-colors">
                                ✕ Închide Documentul
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-gray-200 relative w-full h-full flex items-center justify-center">
                            {(previewLoading || previewUrl === 'loading') ? (
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                    <span className="text-gray-600 font-semibold">Generăm și Arhivăm documentul...</span>
                                </div>
                            ) : (
                                <iframe src={previewUrl} className="w-full h-full shadow-inner" frameBorder="0"></iframe>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Toast Notification Engine */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[60] animate-fade-in-up">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
                        toast.type === 'success' ? 'bg-white border-green-100' : 'bg-red-50 border-red-100'
                    }`}>
                        {toast.type === 'success' ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                        <span className={`font-semibold ${toast.type === 'success' ? 'text-gray-800' : 'text-red-800'}`}>
                            {toast.message}
                        </span>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
