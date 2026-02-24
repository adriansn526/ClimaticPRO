'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PaginationProps {
    pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
        hasPreviousPage?: boolean;
        startCursor?: string;
    };
}

export default function Pagination({ pageInfo }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleNext = () => {
        if (!pageInfo.hasNextPage || !pageInfo.endCursor) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('after', pageInfo.endCursor);
        // Reset window scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push(`?${params.toString()}`);
    };

    const handleReset = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('after');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push(`?${params.toString()}`);
    };

    if (!pageInfo.hasNextPage && !searchParams.has('after')) {
        return null;
    }

    return (
        <div className="flex justify-center items-center gap-4 mt-12">
            {searchParams.has('after') && (
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Prima Pagină
                </Button>
            )}

            {pageInfo.hasNextPage && (
                <Button
                    variant="primary"
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 !bg-blue-600 !text-white hover:!bg-blue-700 font-bold shadow-md"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                    Pagina Următoare
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
