'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, CreditCard, Truck, CheckCircle, ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, updateQuantity, clearCart } = useCart();
    const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Shipping API State
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingText, setShippingText] = useState('* Livrarea poate fi gratuită în funcție de zona dvs. și instalare.');
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    // Default back link
    const backLink = '/produse';
    const backLabel = 'Înapoi la Magazin';

    // Form state
    const [formData, setFormData] = useState({
        // Type
        personType: 'juridica' as 'fizica' | 'juridica',
        // Juridica
        cui: '',
        companyName: '',
        regCom: '', // Număr Registrul Comerțului
        // Contact
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        // Billing Address
        billingAddress: '',
        billingCity: '',
        billingCounty: '',
        billingPostalCode: '',
        // Shipping Address
        shippingMethod: 'delivery' as 'delivery' | 'pickup', // Livrare sau ridicare
        differentShipping: false, // Checkbox pentru "Livrare la altă adresă"
        shippingAddress: '',
        shippingCity: '',
        shippingCounty: '',
        shippingPostalCode: '',
        // Payment
        paymentMethod: 'cash',
        // Notes
        notes: '',
    });

    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [companyLoadSuccess, setCompanyLoadSuccess] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const cleanPrice = (priceStr: string) => {
        if (!priceStr) return 0;
        let cleaned = priceStr
            .replace(/&nbsp;/g, '')
            .replace(/lei/gi, '')
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
        } else if (cleaned.includes('.')) {
            const parts = cleaned.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                cleaned = cleaned.replace(/\./g, '');
            }
        }

        return parseFloat(cleaned) || 0;
    };

    // --- LOGICA DE SEPARARE HARDWARE vs SERVICII ---
    const isService = (product: any) => {
        const name = (product.name || '').toLowerCase();
        const cats = product.categories || [];
        return name.includes('instalar') || name.includes('demontar') || name.includes('serviciu') || cats.some((c: any) => (c.name || '').toLowerCase().includes('servici'));
    };

    const hardwareItems = items.filter(item => !isService(item.product));
    const serviceItems = items.filter(item => isService(item.product));

    const hardwareCount = hardwareItems.reduce((count, item) => count + item.quantity, 0);

    useEffect(() => {
        const fetchShipping = async () => {
            if (formData.shippingMethod === 'pickup') {
                setShippingCost(0);
                setShippingText('Ridicare personală de la sediu - Gratuit.');
                return;
            }
            
            const countyStr = (formData.differentShipping ? formData.shippingCounty : formData.billingCounty).trim();
            if (!countyStr && hardwareCount > 0) {
                // Default fallback if they haven't typed anything
                setShippingCost(hardwareCount * 120);
                setShippingText('Introduceți județul la facturare/livrare pentru calcul exact.');
                return;
            }

            setIsCalculatingShipping(true);
            try {
                const res = await fetch('/api/shipping/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hardwareUnits: hardwareCount,
                        county: countyStr,
                        hasInstallation: serviceItems.length > 0
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setShippingCost(data.shippingCost);
                    setShippingText(data.text);
                }
            } catch (e) {
                console.error(e);
            }
            setIsCalculatingShipping(false);
        };
        
        // Use a debounce timer here to avoid spamming the API on every keypress
        const timer = setTimeout(() => {
            fetchShipping();
        }, 800);
        return () => clearTimeout(timer);
        
    }, [formData.shippingMethod, formData.differentShipping, formData.shippingCounty, formData.billingCounty, items]);

    const hardwareTotal = hardwareItems.reduce((sum, item) => sum + (cleanPrice(item.product.price || item.product.regularPrice || '0') * item.quantity), 0) + shippingCost;
    const serviceTotal = serviceItems.reduce((sum, item) => sum + (cleanPrice(item.product.price || item.product.regularPrice || '0') * item.quantity), 0);

    const finalTotal = hardwareTotal + serviceTotal;

    const fetchCompanyData = async (cui: string) => {
        setIsLoadingCompany(true);
        try {
            // Clean CUI (remove RO prefix, spaces, dashes)
            const cleanCUI = cui
                .replace(/^RO/i, '')
                .replace(/\s/g, '')
                .replace(/-/g, '');

            // Call DataCore API via our endpoint
            const response = await fetch(`/api/company/${cleanCUI}`);

            if (!response.ok) {
                const error = await response.json();
                console.warn('Company fetch error:', error);
                // Don't alert blocking
                return;
            }

            const result = await response.json();

            // DataCore returns data as object, not array
            if (result.data) {
                const company = result.data;
                const address = company.adresaSediuSocial;

                // Auto-fill form with company data
                setFormData((prev) => ({
                    ...prev,
                    companyName: company.denumire || '',
                    regCom: company.nrRegCom || '',
                    billingAddress: `${address?.strada || ''} ${address?.numar || ''}`.trim(),
                    billingCity: address?.localitate || '',
                    billingCounty: address?.judet || '',
                    billingPostalCode: address?.codPostal || '',
                    phone: company.telefon || prev.phone,
                }));

                // Show success message (no alert)
                setCompanyLoadSuccess(true);
                setTimeout(() => setCompanyLoadSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error fetching company data:', error);
        } finally {
            setIsLoadingCompany(false);
        }
    };

    const handleCUIChange = (cui: string) => {
        setFormData({ ...formData, cui });

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Clean CUI for validation
        const cleanCUI = cui
            .replace(/^RO/i, '')
            .replace(/\s/g, '')
            .replace(/-/g, '');

        // Debounce: wait 800ms after user stops typing
        if (cleanCUI.length >= 6 && cleanCUI.length <= 10 && /^\d+$/.test(cleanCUI)) {
            debounceTimer.current = setTimeout(() => {
                fetchCompanyData(cui);
            }, 800);
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Track checkout started
    useEffect(() => {
        if (items.length > 0) {
            posthog.capture('checkout_started', {
                item_count: items.length,
                total_value: totalPrice,
                currency: 'RON',
                items: items.map((i) => ({ product_id: i.product.id, product_name: i.product.name, quantity: i.quantity })),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Prepare Order Payload for WooCommerce
            const orderPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                billingAddress: formData.billingAddress,
                billingCity: formData.billingCity,
                billingCounty: formData.billingCounty,
                shippingAddress: formData.differentShipping ? formData.shippingAddress : formData.billingAddress,
                shippingCity: formData.differentShipping ? formData.shippingCity : formData.billingCity,
                shippingCounty: formData.differentShipping ? formData.shippingCounty : formData.billingCounty,
                paymentMethod: formData.paymentMethod,
                shippingMethod: formData.shippingMethod,
                items: items,
                total: finalTotal,
                hardwareTotal: hardwareTotal,
                serviceTotal: serviceTotal,
                notes: formData.notes
            };

            // 2. Create Order in WooCommerce
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Eroare la plasarea comenzii');
            }

            console.log('✅ Order placed successfully:', result);

            // Redirect to Netopia if card payment
            if (formData.paymentMethod === 'card' && result.paymentUrl) {
                window.location.href = result.paymentUrl;
                return; // Stop execution, don't show success screen yet
            }

            posthog.capture('checkout_completed', {
                order_id: result.orderId,
                total_value: finalTotal,
                currency: 'RON',
                payment_method: formData.paymentMethod,
                shipping_method: formData.shippingMethod,
                person_type: formData.personType,
                item_count: items.length,
            });

            // Clear cart
            clearCart();

            // Show success step
            setStep('success');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('❌ Error placing order:', error);

            const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';

            posthog.capture('checkout_error_shown', {
                error_message: errorMessage,
                payment_method: formData.paymentMethod,
                shipping_method: formData.shippingMethod,
                total_value: finalTotal
            });
            posthog.captureException(error);

            alert(error instanceof Error ? error.message : 'Eroare la plasarea comenzii. Vă rugăm să ne contactați telefonic.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && step !== 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Coșul tău este gol
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Adaugă produse în coș pentru a continua
                    </p>
                    <Link
                        href={backLink}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {backLabel}
                    </Link>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Comandă Plasată cu Succes!
                        </h1>
                        <p className="text-gray-600 mb-2">
                            Comanda ta a fost înregistrată și va fi procesată în cel mai scurt timp.
                        </p>
                        <p className="text-gray-600 mb-8">
                            Vei primi un email de confirmare la <strong>{formData.email}</strong>
                        </p>

                        <div className="space-y-3">
                            <Link
                                href={backLink}
                                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-bold"
                            >
                                {backLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={backLink}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {backLabel}
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Finalizare Comandă</h1>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Form Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    1
                                </span>
                                Informații Contact
                            </h2>

                            {/* Person Type Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-900 mb-3">
                                    Tip Persoană *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${formData.personType === 'fizica' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="personType"
                                            value="fizica"
                                            checked={formData.personType === 'fizica'}
                                            onChange={(e) => setFormData({ ...formData, personType: 'fizica' })}
                                            className="w-5 h-5"
                                            suppressHydrationWarning
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900">Persoană Fizică</p>
                                            <p className="text-sm text-gray-600">Client individual</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${formData.personType === 'juridica' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="personType"
                                            value="juridica"
                                            checked={formData.personType === 'juridica'}
                                            onChange={(e) => setFormData({ ...formData, personType: 'juridica' })}
                                            className="w-5 h-5"
                                            suppressHydrationWarning
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900">Persoană Juridică</p>
                                            <p className="text-sm text-gray-600">Companie / Firmă</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* CUI Field for Juridica */}
                            {formData.personType === 'juridica' && (
                                <>
                                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            CUI / CIF *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={formData.cui}
                                                onChange={(e) => handleCUIChange(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-bold text-gray-900 text-lg bg-white"
                                                placeholder="RO12345678"
                                                suppressHydrationWarning
                                            />
                                            {isLoadingCompany && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-blue-900 mt-2 flex items-center gap-2">
                                            {isLoadingCompany ? (
                                                <>
                                                    <span className="font-semibold">Se încarcă datele firmei...</span>
                                                </>
                                            ) : (
                                                <>
                                                    💡 Introduceți CUI-ul și datele firmei vor fi completate automat
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Nume Companie *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                            suppressHydrationWarning
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Nr. Registrul Comerțului *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.regCom}
                                            onChange={(e) => setFormData({ ...formData, regCom: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                            placeholder="J40/1234/2020"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prenume *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nume *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Telefon *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Billing Address */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    2
                                </span>
                                <CreditCard className="w-5 h-5" />
                                Adresă Facturare
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Adresă completă *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.billingAddress}
                                        onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                        placeholder="Strada, număr, bloc, scară, apartament"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Oraș *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.billingCity}
                                            onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Județ *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.billingCounty}
                                            onChange={(e) => setFormData({ ...formData, billingCounty: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cod Poștal
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.billingPostalCode}
                                            onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Details (If Delivery + Separate Address) */}
                        {formData.shippingMethod === 'delivery' && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        3
                                    </span>
                                    <Truck className="w-5 h-5" />
                                    Detalii Livrare
                                </h2>

                                <div className="mb-4">
                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-600 transition">
                                        <input
                                            type="checkbox"
                                            checked={formData.differentShipping}
                                            onChange={(e) => setFormData({ ...formData, differentShipping: e.target.checked })}
                                            className="w-5 h-5"
                                            suppressHydrationWarning
                                        />
                                        <span className="font-semibold text-gray-900">
                                            📦 Livrare la altă adresă (diferită de facturare)
                                        </span>
                                    </label>
                                </div>

                                {formData.differentShipping && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresă completă *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.shippingAddress || ''}
                                                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                                placeholder="Strada, număr, bloc, scară, apartament"
                                                suppressHydrationWarning
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Oraș *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.shippingCity || ''}
                                                    onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                                    suppressHydrationWarning
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Județ *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.shippingCounty || ''}
                                                    onChange={(e) => setFormData({ ...formData, shippingCounty: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                                    suppressHydrationWarning
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cod Poștal
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.shippingPostalCode || ''}
                                                    onChange={(e) => setFormData({ ...formData, shippingPostalCode: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:outline-none font-semibold text-gray-900 bg-white"
                                                    suppressHydrationWarning
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Sumar Comandă</h2>

                            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
                                {items.map((item) => {
                                    const price = cleanPrice(item.product.price || item.product.regularPrice || '0');
                                    const itemTotal = price * item.quantity;
                                    const imageSrc = item.product.image?.sourceUrl || '';

                                    return (
                                        <div key={item.product.id} className="flex gap-3 py-2 border-b last:border-0 border-gray-100">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                {imageSrc ? (
                                                    <Image
                                                        src={imageSrc}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {price.toLocaleString('ro-RO')} Lei / buc
                                                    </p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-7">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                                                            className="w-7 h-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-gray-100 transition rounded-l-lg"
                                                        >
                                                            {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : '-'}
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            className="w-7 h-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition rounded-r-lg"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="ml-auto text-sm font-bold text-gray-900">
                                                        {itemTotal.toLocaleString('ro-RO')} Lei
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-4 mb-4 pt-4 border-t">
                                <h3 className="font-bold text-gray-900">Cost Transport (Hardware)</h3>
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex justify-between font-bold text-base">
                                        <span>Livrare Curier:</span>
                                        <span className="flex items-center gap-2">
                                            {isCalculatingShipping && <span className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></span>}
                                            {shippingCost === 0 ? 'Gratuit' : `${shippingCost.toLocaleString('ro-RO')} Lei`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {shippingText}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6 pt-4 border-t">
                                <h3 className="font-bold text-gray-900">Metodă de Livrare</h3>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.shippingMethod === 'delivery' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="shippingMethod"
                                            value="delivery"
                                            checked={formData.shippingMethod === 'delivery'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, shippingMethod: 'delivery' });
                                                posthog.capture('shipping_method_selected', { method: 'delivery', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                            suppressHydrationWarning
                                        />
                                        <span className="text-sm text-gray-800">🚚 Livrare la Adresă</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.shippingMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="shippingMethod"
                                            value="pickup"
                                            checked={formData.shippingMethod === 'pickup'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, shippingMethod: 'pickup' });
                                                posthog.capture('shipping_method_selected', { method: 'pickup', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                            suppressHydrationWarning
                                        />
                                        <span className="text-sm text-gray-800">🏢 Ridicare de la Sediu</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6 pt-4 border-t">
                                <h3 className="font-bold text-gray-900">Metodă de Plată</h3>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            checked={formData.paymentMethod === 'card'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, paymentMethod: 'card' });
                                                posthog.capture('payment_method_selected', { method: 'card', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                            suppressHydrationWarning
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-bold text-gray-900">Plata Online cu Cardul Bancar📱</span>
                                            {hardwareTotal > 0 && formData.paymentMethod === 'card' && serviceTotal > 0 && (
                                                <p className="text-xs text-blue-700 mt-1">Se reține <b>doar prețul echipamentelor ({hardwareTotal.toLocaleString('ro-RO')} Lei)</b> de pe card. Instalarea se achită direct echipei.</p>
                                            )}
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            checked={formData.paymentMethod === 'cash'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, paymentMethod: 'cash' });
                                                posthog.capture('payment_method_selected', { method: 'cash', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-800">Ramburs (La livrare)</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="transfer"
                                            checked={formData.paymentMethod === 'transfer'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, paymentMethod: 'transfer' });
                                                posthog.capture('payment_method_selected', { method: 'transfer', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-800">Transfer Bancar</span>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'tbi' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="tbi"
                                            checked={formData.paymentMethod === 'tbi'}
                                            onChange={(e) => {
                                                setFormData({ ...formData, paymentMethod: 'tbi' });
                                                posthog.capture('payment_method_selected', { method: 'tbi', total_value: finalTotal });
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">TBI Bank</span>
                                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">100% Online</span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-0.5">Plată în rate, 100% digital, fără drumuri la bancă. Aprobare rapidă.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t">
                                <div className="flex justify-between text-gray-600">
                                    <span>Echipamente & Produse</span>
                                    <span>{hardwareTotal > 0 ? hardwareTotal.toLocaleString('ro-RO') + ' Lei' : '0 Lei'}</span>
                                </div>
                                {serviceTotal > 0 && (
                                    <div className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 -mx-2 rounded-md font-medium">
                                        <span>Servicii Instalare</span>
                                        <span className="font-bold text-gray-900">{serviceTotal.toLocaleString('ro-RO')} Lei</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                                    <span className="text-gray-600">Transport</span>
                                    <span className="font-bold text-gray-900">{shippingCost === 0 ? 'Gratuit' : `${shippingCost.toLocaleString('ro-RO')} Lei`}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-blue-600 pt-2">
                                    <span>Total de Plată:</span>
                                    <span>{finalTotal.toLocaleString('ro-RO')} Lei</span>
                                </div>
                                {formData.paymentMethod === 'card' && serviceTotal > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Atenție!</strong> Prin plata pe site vi se vor retrage <b>strict {hardwareTotal.toLocaleString('ro-RO')} RON</b> pentru echipamente, urmând să achitați cash plata pentru instalare ({serviceTotal.toLocaleString('ro-RO')} RON) prestatorului serviciilor.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-6 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSubmitting ? 'Se procesează...' : 'Confirma Comanda'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
