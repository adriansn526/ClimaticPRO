'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ViewToggle() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'grid';

    const setView = (view: 'grid' | 'list') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', view);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-md transition-colors ${currentView === 'grid'
                        ? 'bg-primary-50 text-base-content shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                aria-label="Grid view"
            >
                <LayoutGrid className="w-5 h-5 text-black" />
            </button>
            <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition-colors ${currentView === 'list'
                        ? 'bg-primary-50 text-base-content shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                aria-label="List view"
            >
                <List className="w-5 h-5 text-black" />
            </button>
        </div>
    );
}
