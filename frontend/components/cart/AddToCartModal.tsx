'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Shield, Wrench, ArrowRight, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { useCart } from '@/contexts/CartContext';
import { cleanPrice } from '@/lib/productUtils';

interface AddToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: WooCommerceProduct;
    quantity: number;
    relatedServices?: WooCommerceProduct[]; // e.g. Installation
    onSelectInstallation?: (service: WooCommerceProduct) => void;
}

export default function AddToCartModal({ isOpen, onClose, product, quantity, relatedServices = [], onSelectInstallation }: AddToCartModalProps) {
    const { addItem } = useCart();
    const [selectedWarranty, setSelectedWarranty] = useState<number | null>(null); // null = standard, 1 = +1yr, 2 = +2yr

    if (!isOpen) return null;

    // Price parsing logic (reuse robust logic)
    const rawPriceString = product.price ? product.price.replace(/[^0-9.]/g, '') : '0';
    const priceValue = parseFloat(rawPriceString) || 0;

    // Warranty Prices
    const warranty1YearPrice = Math.round(priceValue * 0.10);
    const warranty2YearPrice = Math.round(priceValue * 0.18);

    // Check if product is AC
    const isAC = product.productCategories?.nodes?.some(c =>
        c.slug.includes('aer') ||
        c.name.toLowerCase().includes('aer') ||
        c.name.toLowerCase().includes('condit')
    );

    const handleWarrantyChange = (val: number | null) => {
        setSelectedWarranty(val);
        // Note: In a real implementation, you would add the warranty product to cart here or store selection
        // For now, we just update UI state.
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 my-auto" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-green-50 border-b border-green-100 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-green-800">Produsul a fost adăugat în coș</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row">

                    {/* Left: Product & Warranty */}
                    <div className="p-6 lg:w-2/3 border-r border-gray-100 space-y-8">

                        {/* Product Summary */}
                        <div className="flex gap-4">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                {product.image && (
                                    <Image
                                        src={product.image.sourceUrl}
                                        alt={product.image.altText || product.name}
                                        fill
                                        className="object-contain p-2"
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                                <div className="text-sm text-gray-500 mt-1">Cantitate: {quantity}</div>
                                <div className="text-xl font-bold text-gray-900 mt-2">{cleanPrice(product.price)}</div>
                            </div>
                        </div>

                        {/* Extended Warranty Upsell */}
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-900">Extinde garanția standard!</span>
                            </div>
                            <div className="p-4 space-y-3">
                                <p className="text-sm text-gray-600 mb-2">
                                    <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" /> Prioritate în service
                                    <span className="mx-2">•</span>
                                    <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" /> Înlocuire produs
                                </p>

                                {/* Options */}
                                <div className="grid grid-cols-1 gap-3">
                                    <label className={`cursor-pointer border-2 rounded-lg p-3 flex items-center justify-between transition ${selectedWarranty === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="warranty"
                                                checked={selectedWarranty === null}
                                                onChange={() => handleWarrantyChange(null)}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Fără garanție extinsă (Standard)</p>
                                                <p className="text-xs text-gray-500">Garanție inclusă</p>
                                            </div>
                                        </div>
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`cursor-pointer border-2 rounded-lg p-3 flex items-center justify-between transition ${selectedWarranty === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="warranty"
                                                    checked={selectedWarranty === 1}
                                                    onChange={() => handleWarrantyChange(1)}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Garanție Plus 1 AN</p>
                                                    <p className="text-xs text-gray-500">{warranty1YearPrice} Lei</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`cursor-pointer border-2 rounded-lg p-3 flex items-center justify-between transition ${selectedWarranty === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="warranty"
                                                    checked={selectedWarranty === 2}
                                                    onChange={() => handleWarrantyChange(2)}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Garanție Plus 2 ANI</p>
                                                    <p className="text-xs text-gray-500">{warranty2YearPrice} Lei</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Installation Upsell (only for AC) */}
                        {isAC && relatedServices.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-900 font-bold">
                                    <Wrench className="w-5 h-5 text-gray-600" />
                                    Adaugă și instalare profesională:
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {relatedServices.map(service => (
                                        <div
                                            key={service.id}
                                            className="border rounded-lg p-3 flex justify-between items-center hover:border-gray-400 transition cursor-pointer"
                                            onClick={() => {
                                                if (onSelectInstallation) {
                                                    onSelectInstallation(service);
                                                } else {
                                                    addItem(service, 1);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 relative bg-gray-100 rounded">
                                                    {service.image && <Image src={service.image.sourceUrl} alt={service.name} fill className="object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{service.name}</p>
                                                    <p className="font-bold text-sm">{cleanPrice(service.price)}</p>
                                                </div>
                                            </div>
                                            <button className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-xs font-bold hover:bg-orange-200">
                                                Adaugă
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right: Actions */}
                    <div className="p-6 lg:w-1/3 bg-gray-50 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Pasul următor</h3>
                            <p className="text-sm text-gray-600">
                                Produsele din coșul tău sunt rezervate timp de 30 de minute.
                            </p>
                        </div>

                        <div className="space-y-3 mt-8">
                            <Link
                                href="/checkout"
                                className="block w-full bg-orange-500 text-white text-center py-3 rounded-lg font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                            >
                                Vezi detalii coș <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={onClose}
                                className="block w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
                            >
                                Continuă cumpărăturile
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
