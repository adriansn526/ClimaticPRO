'use client';

import { useWishlist } from '@/lib/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import { exportWishlistToPDF } from '@/lib/utils/exportWishlistPDF';
import ShareWishlistModal from '@/components/wishlist/ShareWishlistModal';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

export default function WishlistClient() {
    const { wishlist, removeFromWishlist, clearWishlist, count, isLoaded } = useWishlist();
    const { addItem } = useCart();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedCount, setAddedCount] = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const posthog = usePostHog();

    const handleExportPDF = () => {
        posthog?.capture('quote_pdf_downloaded', { source: 'wishlist' });
        exportWishlistToPDF(wishlist, {
            companyName: 'ClimaticPro',
            contactEmail: 'contact@climaticpro.ro',
            contactPhone: '+40 700 000 000',
        });
    };

    const handleAddAllToCart = async () => {
        setIsAddingToCart(true);
        setAddedCount(0);

        // Add each item with a small delay for visual feedback
        for (let i = 0; i < wishlist.length; i++) {
            const item = wishlist[i];
            // Adapt WishlistItem to Product
            addItem({
                id: item.id,
                name: item.name,
                slug: item.slug || '',
                price: item.price,
                image: item.image ? { sourceUrl: item.image, altText: item.name } : null,
                stockStatus: 'instock', // Assume in stock for wishlist items
            } as any, 1);
            setAddedCount(i + 1);
            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsAddingToCart(false);

        // Open cart drawer
        window.dispatchEvent(new CustomEvent('open-cart'));
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Se încarcă...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 overflow-x-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 max-w-full">
                    {/* Header */}
                    <div className="mb-3 sm:mb-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-1 sm:mb-2">
                            Lista de Favorite
                        </h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                            {count === 0 ? 'Nu ai produse favorite' : `${count} ${count === 1 ? 'produs salvat' : 'produse salvate'}`}
                        </p>
                    </div>

                    {/* Actions */}
                    {count > 0 && (
                        <>
                            {/* Desktop: Toate butoanele */}
                            <div className="hidden lg:flex gap-3">
                                <button
                                    onClick={handleAddAllToCart}
                                    disabled={isAddingToCart}
                                    className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Adăugare... ({addedCount}/{count})
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Adaugă toate
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Partajează
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    PDF
                                </button>
                                <button
                                    onClick={clearWishlist}
                                    className="px-4 py-2 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                    Șterge
                                </button>
                            </div>

                            {/* Mobile: Butoane compacte pe același rând */}
                            <div className="lg:hidden flex gap-2">
                                <button
                                    onClick={handleAddAllToCart}
                                    disabled={isAddingToCart}
                                    className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs sm:text-sm"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span className="hidden sm:inline">Adăugare...</span>
                                            <span>({addedCount}/{count})</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            <span className="hidden sm:inline">Adaugă în coș</span>
                                            <span className="sm:hidden">Coș</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                                    title="Partajează lista"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
                {count === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-2xl mx-auto">
                        <div className="text-8xl mb-6">❤️</div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Lista ta de favorite este goală
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Salvează produsele tale preferate pentru a le găsi mai ușor mai târziu.
                        </p>
                        <Link
                            href="/produse"
                            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Explorează Produsele
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {wishlist.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                            >
                                {/* Product Image */}
                                <Link href={`/produse/${item.slug}`} className="block">
                                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ShoppingCart className="w-20 h-20" />
                                            </div>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                removeFromWishlist(item.id)
                                            }}
                                            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-red-600 hover:bg-red-50 shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Elimină din favorite"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="p-4">
                                    <Link href={`/produse/${item.slug}`}>
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    {item.price && (
                                        <div className="text-xl font-bold text-primary-600 mb-4">
                                            {item.price.replace(/&nbsp;/g, ' ').replace(/\s*RON\s*$/i, '').trim()}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/produse/${item.slug}`}
                                            className="flex-1 text-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                            Vezi Produs
                                        </Link>
                                        <button
                                            onClick={() => removeFromWishlist(item.id)}
                                            className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:border-red-600 hover:text-red-600 transition-colors"
                                            title="Elimină"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Additional Actions */}
                {count > 0 && (
                    <div className="mt-12 bg-white rounded-xl shadow-md p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Gata să comanzi?
                                </h3>
                                <p className="text-gray-600">
                                    Contactează-ne pentru o ofertă personalizată pentru produsele tale favorite.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleAddAllToCart}
                                    disabled={isAddingToCart}
                                    className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Adăugare ({addedCount}/{count})
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            🛒 Adaugă toate în coș
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descarcă PDF
                                </button>
                                <Link
                                    href="/contact"
                                    className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
                                >
                                    📞 Solicită Ofertă
                                </Link>
                                <Link
                                    href="/produse"
                                    className="px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors whitespace-nowrap"
                                >
                                    Continuă Cumpărăturile
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <ShareWishlistModal
                wishlist={wishlist}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />

            {/* Mobile FAB Menu */}
            {count > 0 && (
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    {/* Menu Options */}
                    {showMobileMenu && (
                        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2">
                            <button
                                onClick={() => {
                                    handleExportPDF()
                                    setShowMobileMenu(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export PDF
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Sigur vrei să ștergi toate produsele?')) {
                                        clearWishlist()
                                    }
                                    setShowMobileMenu(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Șterge toate
                            </button>
                        </div>
                    )}

                    {/* FAB Button */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center hover:scale-110"
                    >
                        {showMobileMenu ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </main>
    );
}
