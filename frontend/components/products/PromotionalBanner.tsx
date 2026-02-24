import Link from 'next/link';
import Image from 'next/image';
import { WooCommerceProduct } from '@/lib/woocommerce';

interface PromotionalBannerProps {
    product?: WooCommerceProduct;
    installationProduct?: WooCommerceProduct | null;
}

export default function PromotionalBanner({ product, installationProduct }: PromotionalBannerProps) {
    if (!product) return null;

    const bgImage = product.image?.sourceUrl || '/images/hero-bg.jpg';

    // Helper to clean price HTML (remove &nbsp; lei) and raw value
    const formatPrice = (price: string) => {
        if (!price) return '';
        // Remove HTML entities and existing currency
        return price.replace(/&nbsp;/g, ' ').replace(/lei/gi, '').trim();
    }

    // Parse price string to number for calculation
    const parsePrice = (priceStr: string) => {
        if (!priceStr) return 0;
        // Clean and attempt to parse standard WC formats
        const clean = priceStr.replace(/&nbsp;/g, '').replace(/lei/gi, '').trim();
        // Remove thousands separators (,)
        return parseFloat(clean.replace(/,/g, ''));
    }

    const installPrice = installationProduct ? parsePrice(installationProduct.price) : 0;
    const productPrice = product.salePrice ? parsePrice(product.salePrice) : parsePrice(product.price);

    // Calculate Total
    const totalPrice = productPrice + installPrice;

    // Helper to format back to locale string (approximate for display)
    const displayTotal = totalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg mb-8 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/30 z-10"></div>

            {/* Background Image (faded) */}
            <div className="absolute inset-0 opacity-20">
                <Image
                    src={bgImage}
                    alt="Offer Background"
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-cover"
                />
            </div>

            <div className="relative z-20 flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8">
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                        <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Ofertă Specială
                        </span>
                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                            + Instalare
                        </span>
                    </div>

                    <h2 className="text-xl md:text-3xl font-medium mb-3 leading-tight text-white/90">
                        {product.name}
                    </h2>

                    <div className="text-xl md:text-3xl font-bold text-yellow-300 mb-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
                        {/* Always show only the TOTAL price if installation is present. Or usage: 
                           User said: "afisam pretul cu instalare in banner... adunata la total"
                        */}
                        <span>{displayTotal} lei</span>

                        <span className="text-xs md:text-sm text-green-300 font-medium bg-green-900/40 px-3 py-1 rounded-full border border-green-500/30">
                            Kit instalare până la 3m inclus
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Link
                            href={`/produs/${product.slug}`}
                            className="inline-block bg-white text-slate-900 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors shadow-md w-full md:w-auto text-center"
                        >
                            Vezi Oferta
                        </Link>

                        <div className="text-xs text-gray-300 font-medium flex flex-col items-center md:items-start gap-1">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Transport Gratuit în București & Ilfov
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Montaj în ziua livrării
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/3 flex justify-center">
                    <div className="relative w-full max-w-[220px] aspect-square bg-white rounded-xl p-4 shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500">
                        <Image
                            src={product.image?.sourceUrl || '/images/product-placeholder.svg'}
                            alt={product.image?.altText || product.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 220px"
                            className="object-contain p-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
