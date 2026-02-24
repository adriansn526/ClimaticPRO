'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from './CartDrawer';

export default function CartIcon() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { totalItems } = useCart();

    return (
        <>
            <button
                onClick={() => setIsDrawerOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label={`Coș de cumpărături${totalItems > 0 ? ` (${totalItems} ${totalItems === 1 ? 'produs' : 'produse'})` : ' (gol)'}`}
                suppressHydrationWarning
            >
                <ShoppingCart className="w-6 h-6 text-gray-700" aria-hidden="true" />
                {totalItems > 0 && (
                    <span
                        className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                        aria-hidden="true"
                    >
                        {totalItems > 9 ? '9+' : totalItems}
                    </span>
                )}
            </button>

            <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
}
