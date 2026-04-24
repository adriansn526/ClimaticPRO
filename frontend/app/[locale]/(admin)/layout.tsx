'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Determine active tab from URL or pathname
    const urlTab = searchParams.get('tab') as 'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing' | null;

    let activeTab: any = urlTab || 'orders';
    if (pathname.includes('/catalog-b2b')) activeTab = 'catalog-b2b';
    if (pathname.includes('/comenzi-b2b')) activeTab = 'comenzi-b2b';
    if (pathname.includes('/tichete')) activeTab = 'tichete';
    if (pathname.includes('/furnizori')) activeTab = 'furnizori';

    const setActiveTab = (tab: 'dashboard' | 'stocks' | 'installers' | 'orders' | 'marketing') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        // If we are not on the main /admin page, navigate there first
        if (pathname !== '/ro/admin' && pathname !== '/admin') {
            router.push(`/admin?${params.toString()}`);
        } else {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    const handleLogout = () => {
        // Implementation based on useAuth or dispatch
        router.push('/cont/login');
    };

    return (
        <div className="admin-dashboard-wrapper h-screen bg-transparent flex flex-col md:flex-row w-full max-w-[100vw] overflow-hidden">
            <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} logout={handleLogout} />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto h-screen relative">
                {children}
            </div>
        </div>
    );
}
