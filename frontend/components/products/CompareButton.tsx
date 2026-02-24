'use client';

import { GitCompare } from 'lucide-react';
import { useCompare, CompareItem } from '@/lib/hooks/useCompare';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface CompareButtonProps {
    product: CompareItem;
    className?: string;
    showText?: boolean;
}

export default function CompareButton({ product, className, showText = false }: CompareButtonProps) {
    const { isInCompare, toggleCompare } = useCompare();
    const isActive = isInCompare(product.id);

    const { showToast } = useToast();

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isActive) {
                    toggleCompare(product);
                    showToast(`${product.name} a fost eliminat din comparare.`, 'info');
                } else {
                    toggleCompare(product);
                    showToast(`${product.name} a fost adăugat la comparare.`, 'success');
                }
            }}
            className={cn(
                "group relative p-2 rounded-full transition-all duration-200",
                isActive
                    ? "bg-primary-50 text-primary-600"
                    : "bg-white text-gray-500 hover:bg-primary-50 hover:text-primary-600",
                className
            )}
            title={isActive ? "Elimină din comparare" : "Adaugă la comparare"}
        >
            <GitCompare className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
            {showText && (
                <span className="ml-2 text-sm font-medium">
                    {isActive ? "Compară" : "Compară"}
                </span>
            )}
        </button>
    );
}
