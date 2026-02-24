'use client';

import { useCompare } from '@/lib/hooks/useCompare';
import NextImage from 'next/image';
import Link from 'next/link';
import { X, Check, Minus, AlertCircle } from 'lucide-react';
import { cleanPrice, formatAttributeLabel, formatAttributeValue } from '@/lib/productUtils';
import { useCart } from '@/contexts/CartContext';

export default function ComparePage() {
    const { compareList, removeFromCompare, clearCompare, count, isLoaded } = useCompare();
    const { addItem } = useCart();

    // Gather all unique attribute names
    const allAttributes = Array.from(new Set(
        compareList.flatMap(p =>
            p.attributes?.map((a: any) => a.name) || []
        )
    )).sort();

    const getAttributeValue = (product: any, attrName: string) => {
        if (!product.attributes) return '-';
        const attr = product.attributes.find((a: any) => a.name === attrName);
        if (!attr || !attr.options || attr.options.length === 0) return '-';
        return attr.options.map((opt: string) => formatAttributeValue(opt)).join(', ');
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    if (count === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⚖️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Nu ai produse de comparat</h1>
                    <p className="text-gray-600 mb-8">
                        Adaugă produse în lista de comparare pentru a vedea diferențele tehnice dintre ele.
                    </p>
                    <Link href="/produse" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 w-full transition-colors">
                        Vezi Produse
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Comparare Produse v2 ({count})
                    </h1>
                    {count > 0 && (
                        <button
                            onClick={clearCompare}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                            Șterge tot
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-4 w-48 min-w-[200px] bg-gray-50 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider sticky left-0 z-10 border-r border-gray-200">
                                        Produs
                                    </th>
                                    {compareList.map((product) => (
                                        <th key={product.id} className="p-6 w-[25%] relative group align-top bg-white hover:bg-gray-50 transition-colors">
                                            <button
                                                onClick={() => removeFromCompare(product.id)}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                                                title="Elimină produs"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            <div className="flex flex-col items-center text-center h-full">
                                                <Link href={`/produs/${product.slug}`} className="block w-full mb-4">
                                                    <div className="relative aspect-square w-full max-w-[180px] mx-auto bg-white rounded-lg p-2">
                                                        <NextImage
                                                            src={product.image || '/images/product-placeholder.svg'}
                                                            alt={product.name}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                </Link>

                                                <Link href={`/produs/${product.slug}`} className="block w-full">
                                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 min-h-[3rem]">
                                                        {product.name}
                                                    </h3>
                                                </Link>

                                                <div className="text-xl font-bold text-primary-600 mb-4 h-8 flex items-center">
                                                    {cleanPrice(product.price)}
                                                </div>

                                                <button
                                                    onClick={() => addItem({
                                                        id: product.id,
                                                        name: product.name,
                                                        slug: product.slug,
                                                        price: product.price,
                                                        image: { sourceUrl: product.image, altText: product.name },
                                                        stockStatus: 'instock'
                                                    }, 1)}
                                                    className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm mt-auto shadow-sm hover:shadow-md"
                                                >
                                                    Adaugă în coș
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                    {/* Empty slots placeholders */}
                                    {Array.from({ length: 4 - count }).map((_, i) => (
                                        <th key={`empty-${i}`} className="p-6 w-[25%] bg-gray-50/50 border-l border-dashed border-gray-200">
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                                                    <span className="text-2xl opacity-50">+</span>
                                                </div>
                                                <span className="text-sm font-medium">Loc liber</span>
                                                <Link href="/produse" className="mt-4 text-primary-600 text-sm hover:underline">
                                                    Adaugă produs
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {allAttributes.map((attrName, idx) => (
                                    <tr key={attrName} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                        <td className="p-4 text-sm font-semibold text-gray-700 sticky left-0 bg-inherit border-r border-gray-200 z-10 flex items-center gap-2">
                                            {formatAttributeLabel(attrName)}
                                        </td>
                                        {compareList.map((product) => {
                                            const val = getAttributeValue(product, attrName);
                                            // Logic pentru checkmarks
                                            const isCheck = val.toLowerCase() === 'da' || val.toLowerCase() === 'yes';
                                            const isX = val.toLowerCase() === 'nu' || val.toLowerCase() === 'no';

                                            return (
                                                <td key={`${product.id}-${attrName}`} className="p-4 text-center text-sm text-gray-600 align-middle">
                                                    {isCheck ? (
                                                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                    ) : isX ? (
                                                        <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                                                    ) : (
                                                        <span className={val === '-' ? 'text-gray-300' : 'font-medium'}>{val}</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        {Array.from({ length: 4 - count }).map((_, i) => (
                                            <td key={`empty-cell-${i}`} className="p-4"></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Notă informativă</p>
                        <p>Specificațiile tehnice sunt preluate automat din descrierea producătorului. Pentru detalii complete, vă rugăm să consultați pagina fiecărui produs în parte sau manualul tehnic.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
