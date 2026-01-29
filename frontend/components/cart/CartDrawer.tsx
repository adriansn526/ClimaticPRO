'use client';

import { createPortal } from 'react-dom';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useEffect, useState } from 'react';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const cleanPrice = (priceStr: string | undefined) => {
        if (!priceStr) return 0;
        let cleaned = priceStr
            .replace(/&nbsp;/g, '')
            .replace(/lei/gi, '')
            .replace(/RON/gi, '')
            .replace(/\s/g, '');

        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
                cleaned = cleaned.replace(/,/g, '');
            } else {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        } else if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            if (parts[1] && parts[1].length > 2) {
                cleaned = cleaned.replace(/,/g, '');
            } else {
                cleaned = cleaned.replace(',', '.');
            }
        }

        return parseFloat(cleaned) || 0;
    };

    if (!isOpen) return null;

    const drawerContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[9999] flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Coș de cumpărături ({totalItems})
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-900 font-bold" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Coșul tău este gol</p>
                            <button
                                onClick={onClose}
                                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                            >
                                Continuă cumpărăturile
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => {
                                const rawPrice = item.product.salePrice || item.product.price || item.product.regularPrice;
                                const price = cleanPrice(rawPrice);
                                const itemTotal = price * item.quantity;

                                return (
                                    <div
                                        key={item.product.id}
                                        className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {item.product.image?.sourceUrl ? (
                                                <Image
                                                    src={item.product.image.sourceUrl}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                                                {item.product.name}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-lg bg-white border-2 border-gray-400 text-gray-900 flex items-center justify-center hover:bg-gray-100 hover:border-gray-600 transition shadow-sm"
                                                    >
                                                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-lg bg-white border-2 border-gray-400 text-gray-900 flex items-center justify-center hover:bg-gray-100 hover:border-gray-600 transition shadow-sm"
                                                    >
                                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Șterge"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-sm text-gray-600">
                                                    {price.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei x {item.quantity}
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    {itemTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 p-6 space-y-4">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between text-lg">
                            <span className="font-semibold text-gray-900">Subtotal:</span>
                            <span className="font-bold text-gray-900">
                                {totalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei
                            </span>
                        </div>

                        {/* Shipping Note */}
                        <p className="text-sm text-gray-600 text-center">
                            Transport și taxe calculate la checkout
                        </p>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/checkout"
                                onClick={onClose}
                                className="block w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors font-bold text-center shadow-lg hover:shadow-xl"
                            >
                                Finalizează Comanda
                            </Link>
                            <button
                                onClick={onClose}
                                className="block w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center"
                            >
                                Continuă Cumpărăturile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // Render în portal pentru a evita stacking context issues
    return mounted
        ? createPortal(drawerContent, document.body)
        : null;
}
