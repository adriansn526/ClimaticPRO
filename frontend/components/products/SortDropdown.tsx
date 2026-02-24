'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SortDropdown() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'newest';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        const value = e.target.value;

        if (value) {
            params.set('sort', value);
        } else {
            params.delete('sort');
        }

        router.push(`?${params.toString()}`);
    };

    return (
        <div className="relative">
            <select
                value={currentSort}
                onChange={handleChange}
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                aria-label="Sort products"
            >
                <option value="newest">Cele mai noi</option>
                <option value="popularity">Cele mai populare</option>
                <option value="price_asc">Preț: Mic la Mare</option>
                <option value="price_desc">Preț: Mare la Mic</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
            </div>
        </div>
    );
}
