'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Package, MapPin, User, LogOut } from 'lucide-react';

export default function ClientDashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Contul Meu</h1>
                    <button
                        onClick={logout}
                        className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Deconectare
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar */}
                    <aside className="w-full md:w-64 shrink-0">
                        <nav className="space-y-1">
                            <Link
                                href="/cont/client"
                                className="bg-primary-50 text-primary-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                            >
                                <Package className="mr-3 h-5 w-5 flex-shrink-0 text-primary-500" />
                                Comenzile Mele
                            </Link>

                            <Link
                                href="/cont/client/adrese"
                                className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                            >
                                <MapPin className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                                Adrese
                            </Link>

                            <Link
                                href="/cont/client/profil"
                                className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                            >
                                <User className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                                Detalii Cont
                            </Link>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Bun venit, {user?.name || 'Client'}!
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                    Aici poți vedea statusul comenzilor tale.
                                </p>
                            </div>
                        </div>

                        {/* Orders List Placeholder */}
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul role="list" className="divide-y divide-gray-200">
                                {/* Mock Order */}
                                <li>
                                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-primary-600 truncate">
                                                Comanda #1234
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Finalizată
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <Package className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    Aparat AC Gree Pulsar 12000 BTU
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    31 Ian 2026
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-primary-600 truncate">
                                                Comanda #1235
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    În Procesare
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <Package className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    Kit Instalare 3m
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    01 Feb 2026
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
