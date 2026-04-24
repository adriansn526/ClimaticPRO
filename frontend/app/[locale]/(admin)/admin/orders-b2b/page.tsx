import React from 'react';
import AdminB2BOrdersTable from '@/components/admin/orders/AdminB2BOrdersTable';

export const metadata = {
    title: 'Comenzi Echipe (E-Shop B2B) | Admin',
};

export default function AdminB2BOrdersPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comenzi Instalatori (B2B)</h1>
                    <p className="text-gray-500 mt-1">Urmărește necesarul de consumabile și materiale cerute de echipele tale pe teren.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">
                        E-Shop Activ
                    </div>
                </div>
            </div>

            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                <AdminB2BOrdersTable />
            </div>
        </div>
    );
}
