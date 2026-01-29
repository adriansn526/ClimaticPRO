'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, CreditCard, Truck, CheckCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();
    const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');

    // Form state
    // Using explicit types for better type safety if needed, but inference is fine here
    const [formData, setFormData] = useState({
        // Contact
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        // Shipping Address
        address: '',
        city: '',
        county: '',
        postalCode: '',
        // Payment
        paymentMethod: 'card' as 'card' | 'cash' | 'transfer',
        // Notes
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect if cart is empty
    useEffect(() => {
        if (mounted && items.length === 0 && step !== 'success') {
            router.push('/produse');
        }
    }, [items.length, step, router, mounted]);

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

    // Shipping cost calculation
    const shippingCost = totalPrice >= 200 ? 0 : 30;
    const finalTotal = totalPrice + shippingCost;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Prenumele este obligatoriu';
        if (!formData.lastName.trim()) newErrors.lastName = 'Numele este obligatoriu';
        if (!formData.email.trim()) {
            newErrors.email = 'Email-ul este obligatoriu';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalid';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefonul este obligatoriu';
        } else if (!/^[0-9+\s()-]{10,}$/.test(formData.phone)) {
            newErrors.phone = 'Telefon invalid';
        }
        if (!formData.address.trim()) newErrors.address = 'Adresa este obligatorie';
        if (!formData.city.trim()) newErrors.city = 'Orașul este obligatoriu';
        if (!formData.county.trim()) newErrors.county = 'Județul este obligatoriu';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Codul poștal este obligatoriu';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 'info') {
            if (validateForm()) {
                setStep('payment');
            }
            return;
        }

        if (step === 'payment') {
            setIsSubmitting(true);

            // Simulate order submission
            setTimeout(() => {
                const orderNum = `CP${Date.now().toString().slice(-8)}`; // Changed prefix to CP for ClimaticPro
                setOrderNumber(orderNum);
                setStep('success');
                clearCart();
                setIsSubmitting(false);
            }, 1500);
        }
    };

    if (!mounted) return null;

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Comandă plasată cu succes!
                        </h1>
                        <p className="text-lg text-gray-600 mb-2">
                            Număr comandă: <span className="font-bold text-primary-600">{orderNumber}</span>
                        </p>
                        <p className="text-gray-600 mb-8">
                            Veți primi un email de confirmare la adresa <strong>{formData.email}</strong>
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-4">Ce urmează?</h3>
                            <ul className="text-left space-y-2 text-gray-700">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Veți primi un email cu detaliile comenzii</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Echipa noastră va procesa comanda în cel mai scurt timp</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Veți fi contactat pentru confirmarea livrării</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/produse"
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                            >
                                Continuă cumpărăturile
                            </Link>
                            <Link
                                href="/"
                                className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Înapoi la pagina principală
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/produse"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Înapoi la produse
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Finalizare comandă</h1>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step === 'info' ? 'text-primary-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'info' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                                }`}>
                                1
                            </div>
                            <span className="font-semibold hidden sm:inline">Informații</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-300" />
                        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'payment' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                                }`}>
                                2
                            </div>
                            <span className="font-semibold hidden sm:inline">Plată</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {step === 'info' && (
                                <>
                                    {/* Contact Information */}
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Truck className="w-6 h-6 text-primary-600" />
                                            Informații de contact
                                        </h2>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Prenume *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.firstName && (
                                                    <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Nume *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.lastName && (
                                                    <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.email && (
                                                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Telefon *
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.phone && (
                                                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                                            Adresă de livrare
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Adresă *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.address ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Strada, număr, bloc, scară, apartament"
                                                />
                                                {errors.address && (
                                                    <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                                                )}
                                            </div>
                                            <div className="grid sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Oraș *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.city ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                    />
                                                    {errors.city && (
                                                        <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Județ *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.county}
                                                        onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.county ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                    />
                                                    {errors.county && (
                                                        <p className="text-red-600 text-sm mt-1">{errors.county}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Cod poștal *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.postalCode}
                                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary-600 ${errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                    />
                                                    {errors.postalCode && (
                                                        <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                                            Observații (opțional)
                                        </h2>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                                            placeholder="Instrucțiuni speciale pentru livrare..."
                                        />
                                    </div>
                                </>
                            )}

                            {step === 'payment' && (
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="w-6 h-6 text-primary-600" />
                                        Metodă de plată
                                    </h2>
                                    <div className="space-y-3">
                                        {/* Card */}
                                        <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Card bancar</div>
                                                <div className="text-sm text-gray-600">Visa, Mastercard</div>
                                            </div>
                                        </label>

                                        {/* Cash */}
                                        <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'cash' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cash"
                                                checked={formData.paymentMethod === 'cash'}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Ramburs</div>
                                                <div className="text-sm text-gray-600">Plată la livrare (cash sau card)</div>
                                            </div>
                                        </label>

                                        {/* Transfer */}
                                        <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'transfer' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="transfer"
                                                checked={formData.paymentMethod === 'transfer'}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Transfer bancar</div>
                                                <div className="text-sm text-gray-600">Veți primi detaliile pe email</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                                    Rezumat comandă
                                </h2>

                                {/* Products */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                    {items.map((item) => {
                                        const rawPrice = item.product.salePrice || item.product.price || item.product.regularPrice;
                                        const price = cleanPrice(rawPrice);
                                        return (
                                            <div key={item.product.id} className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                    {item.product.image?.sourceUrl ? (
                                                        <Image
                                                            src={item.product.image.sourceUrl}
                                                            alt={item.product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                        {item.product.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {item.quantity} × {price.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">
                                            {totalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Transport:</span>
                                        <span className="font-semibold">
                                            {shippingCost === 0 ? (
                                                <span className="text-green-600">GRATUIT</span>
                                            ) : (
                                                `${shippingCost.toFixed(2)} Lei`
                                            )}
                                        </span>
                                    </div>
                                    {totalPrice < 200 && (
                                        <p className="text-xs text-gray-600">
                                            Mai adaugă {(200 - totalPrice).toFixed(2)} Lei pentru transport gratuit
                                        </p>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                                        <span>Total:</span>
                                        <span className="text-primary-600">
                                            {finalTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Lei
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 space-y-3">
                                    {step === 'info' && (
                                        <button
                                            type="submit"
                                            className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                                        >
                                            Continuă la plată
                                        </button>
                                    )}
                                    {step === 'payment' && (
                                        <>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 transition-colors font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Se procesează...' : 'Plasează comanda'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep('info')}
                                                className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                                            >
                                                Înapoi
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="text-xs text-gray-600">
                                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                            <span>Plată securizată</span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            <Truck className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                                            <span>Livrare rapidă</span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                            <span>Calitate garantată</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
