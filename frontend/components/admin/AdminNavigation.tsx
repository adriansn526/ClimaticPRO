'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Package, Settings, BarChart, Search, LogOut, FileText, Megaphone, Menu, X, Landmark, FolderOpen, Truck } from 'lucide-react';

interface AdminNavigationProps {
    activeTab: string;
    setActiveTab: (tab: 'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing') => void;
    logout: () => void;
}

export default function AdminNavigation({ activeTab, setActiveTab, logout }: AdminNavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleTabClick = (tab: any) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false); // Close mobile menu on click
    };

    const navContent = (
        <>
            <div className="p-6 border-b border-gray-100 hidden md:block shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-xs text-gray-400 mt-1">Super Admin Control</p>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto flex-1 pb-10">
                <button
                    onClick={() => handleTabClick('dashboard')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <BarChart className="w-5 h-5 mr-3" />
                    Dashboard
                </button>
                <button
                    onClick={() => handleTabClick('orders')}
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
                    onClick={() => handleTabClick('stocks')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stocks' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Package className="w-5 h-5 mr-3" />
                    Gestiune Stocuri
                </button>
                <button
                    onClick={() => handleTabClick('installers')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'installers' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Users className="w-5 h-5 mr-3" />
                    Instalatori
                </button>
                <Link
                    href="/admin/furnizori"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'furnizori' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Truck className="w-5 h-5 mr-3 text-orange-500" />
                    Management Furnizori
                </Link>
                <Link
                    href="/admin/orders-b2b"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders-b2b' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <FileText className="w-5 h-5 mr-3" />
                    Comenzi B2B (Mărfi)
                </Link>
                <Link
                    href="/admin/documente"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documente' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <FolderOpen className="w-5 h-5 mr-3 text-indigo-500" />
                    Arhivă Documente & Facturi
                </Link>
                <Link
                    href="/admin/tichete"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tichete' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Settings className="w-5 h-5 mr-3 text-emerald-500" />
                    Tichete Suport (App)
                </Link>
                <Link
                    href="/admin/catalog-b2b"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'catalog-b2b' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Package className="w-5 h-5 mr-3" />
                    Catalog Produse B2B
                </Link>
                <Link
                    href="/admin/setari"
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'setari' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Landmark className="w-5 h-5 mr-3" />
                    Setări Baza de Date
                </Link>
                <button
                    onClick={() => handleTabClick('marketing')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors md:mt-4 ${activeTab === 'marketing' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Megaphone className="w-5 h-5 mr-3" />
                    Marketing Hub
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
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col h-screen sticky top-0 z-50 shrink-0 shadow-sm">
                {navContent}
            </div>

            {/* Mobile Top Header + Horizontal Scroll Navbar (Sticky) */}
            <div className="md:hidden sticky top-0 z-50 bg-white shadow-sm w-full flex flex-col border-b border-gray-200">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
                    <h1 className="text-lg font-black text-gray-900">Admin</h1>
                    <button
                        onClick={logout}
                        className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex overflow-x-auto no-scrollbar px-3 py-3 space-x-2 bg-gray-50/50 flex-nowrap items-center w-full">
                    <button
                        onClick={() => handleTabClick('dashboard')}
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <BarChart className="w-4 h-4 mr-2" /> 
                        Dashboard
                    </button>
                    <button
                        onClick={() => handleTabClick('orders')}
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Comenzi Noi
                    </button>
                    <button
                        onClick={() => handleTabClick('stocks')}
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'stocks' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Stocuri
                    </button>
                    <button
                        onClick={() => handleTabClick('installers')}
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'installers' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Instalatori
                    </button>
                    <Link
                        href="/admin/furnizori"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'furnizori' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Truck className={`w-4 h-4 mr-2 ${activeTab === 'furnizori' ? 'text-white' : 'text-orange-500'}`} />
                        Furnizori
                    </Link>
                    <Link
                        href="/admin/orders-b2b"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'orders-b2b' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Comenzi B2B
                    </Link>
                    <button
                        onClick={() => handleTabClick('marketing')}
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'marketing' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Megaphone className="w-4 h-4 mr-2" />
                        Marketing
                    </button>
                    <Link
                        href="/admin/documente"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'documente' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <FolderOpen className={`w-4 h-4 mr-2 ${activeTab === 'documente' ? 'text-white' : 'text-indigo-500'}`} />
                        Arhivă
                    </Link>
                    <Link
                        href="/admin/tichete"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'tichete' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Settings className={`w-4 h-4 mr-2 ${activeTab === 'tichete' ? 'text-white' : 'text-emerald-500'}`} />
                        Tichete
                    </Link>
                    <Link
                        href="/admin/catalog-b2b"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'catalog-b2b' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Catalog B2B
                    </Link>
                    <Link
                        href="/admin/setari"
                        className={`whitespace-nowrap flex items-center shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'setari' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50'}`}
                    >
                        <Landmark className="w-4 h-4 mr-2" />
                        DB Setări
                    </Link>
                </div>
            </div>
        </>
    );
}
