'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountIndexPage() {
    const { isAuthenticated, isInstaller, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace('/cont/login');
        } else if (isInstaller) {
            router.replace('/cont/instalator');
        } else {
            router.replace('/cont/client');
        }
    }, [isAuthenticated, isInstaller, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );
}
