'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, addDays, isSameDay, isWeekend, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { WooCommerceProduct } from '@/lib/woocommerce';
import { useCart } from '@/contexts/CartContext';

interface DayBooking {
    date: Date;
    bookingsCount: number;
    maxBookings: number;
    isAvailable: boolean;
    isScarce?: boolean;
}

interface ProductInstallationModalProps {
    isOpen: boolean;
    onClose: () => void;
    standardInstallation: WooCommerceProduct | null;
    premiumInstallation: WooCommerceProduct | null;
    mainProduct: WooCommerceProduct;
    mainProductQuantity?: number;
    preSelectedInstallation?: WooCommerceProduct | null;
}

export default function ProductInstallationModal({
    isOpen,
    onClose,
    standardInstallation,
    premiumInstallation,
    mainProduct,
    mainProductQuantity = 1,
    preSelectedInstallation
}: ProductInstallationModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<DayBooking[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch availability
    useEffect(() => {
        if (isOpen && step === 1) {
            // ... existing fetch logic ...
            const fetchAvailability = async () => {
                setLoading(true);
                const today = startOfDay(new Date());
                try {
                    const endDate = addDays(today, 30);
                    const response = await fetch(`/api/calendar/availability?timeMin=${today.toISOString()}&timeMax=${endDate.toISOString()}`);
                    let busySlots: any[] = [];
                    let scarceSlots: any[] = [];

                    if (response.ok) {
                        const data = await response.json();
                        busySlots = data.busySlots || [];
                        scarceSlots = data.scarceSlots || [];
                    }

                    const days: DayBooking[] = [];
                    for (let i = 0; i < 30; i++) {
                        const date = addDays(today, i);
                        const isBusy = busySlots.some((slot: any) => isSameDay(new Date(slot.start), date));
                        const isScarce = scarceSlots.some((slot: any) => isSameDay(new Date(slot.start), date));
                        const maxBookings = 3;
                        const isDayWeekend = isWeekend(date);

                        days.push({
                            date,
                            bookingsCount: isBusy ? maxBookings : 0,
                            maxBookings,
                            isAvailable: !isDayWeekend && !isBusy,
                            isScarce: isScarce && !isBusy
                        });
                    }
                    setBookings(days);
                } catch (error) {
                    console.error('Error fetching availability:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchAvailability();
        }
    }, [isOpen, step]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedDate(null);
            setSuccessMessage(null);
        }
    }, [isOpen]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);

        // If we have a pre-selected installation (Upsell mode), add it immediately after date selection
        if (preSelectedInstallation) {
            handleAddToCart(preSelectedInstallation);
        } else {
            setStep(2);
        }
    };

    const getPrice = (product: WooCommerceProduct | null) => {
        if (!product) return 0;
        return parseFloat((product.salePrice || product.price || '0').replace(/[^0-9.]/g, ''));
    };

    const { addItem, setIsCartOpen } = useCart();



    const handleAddToCart = async (installProduct: WooCommerceProduct | null) => {
        if (!installProduct) return;

        // If NOT pre-selected (Standard flow from product page), add main product.
        // If pre-selected (Upsell flow from Cart Modal), main product is ALREADY in cart.
        if (!preSelectedInstallation) {
            addItem(mainProduct, mainProductQuantity);
        }

        // Add installation product matching the equipment quantity
        addItem(installProduct, mainProductQuantity);

        // Show success message
        setSuccessMessage('Produsele au fost adăugate în coș!');

        // Close modal after delay and redirect if Upsell
        setTimeout(() => {
            onClose();
            if (preSelectedInstallation) {
                router.push('/checkout');
            } else {
                setIsCartOpen(true);
            }
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    {successMessage ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Succes!</h3>
                            <p className="text-gray-600">{successMessage}</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {step === 1 ? 'Selectează Data Instalării' : 'Alege Tipul Instalării'}
                                    </h2>
                                    {step === 2 && selectedDate && (
                                        <p className="text-sm text-cyan-600 font-medium">
                                            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}
                                        </p>
                                    )}
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {step === 1 ? (
                                    <div>
                                        {loading ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                                                {bookings.map((day, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => day.isAvailable && handleDateSelect(day.date)}
                                                        disabled={!day.isAvailable}
                                                        className={`
                                            p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all
                                            ${day.isAvailable
                                                                ? 'border-gray-100 bg-white hover:border-cyan-500 hover:shadow-md'
                                                                : 'border-transparent bg-gray-50 opacity-50 cursor-not-allowed'
                                                            }
                                        `}
                                                    >
                                                        <span className="text-xs font-semibold uppercase text-gray-400">
                                                            {format(day.date, 'EEE', { locale: ro })}
                                                        </span>
                                                        <span className={`text-lg font-bold ${day.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {format(day.date, 'd', { locale: ro })}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 capitalize">
                                                            {format(day.date, 'MMMM', { locale: ro })}
                                                        </span>
                                                        {day.isAvailable && !day.isScarce && (
                                                            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                                Liber
                                                            </span>
                                                        )}
                                                        {day.isAvailable && day.isScarce && (
                                                            <span className="text-[10px] text-orange-600 font-medium bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full mt-1">
                                                                1 Loc
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 mt-4 text-center">
                                            * Datele marcate sunt disponibile pentru instalare rapidă.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Standard Option */}
                                        <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-cyan-500 transition-all cursor-pointer group"
                                            onClick={() => handleAddToCart(standardInstallation)}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">Instalare Standard</h3>
                                                    <p className="text-sm text-gray-500">Montaj de bază inclus</p>
                                                </div>
                                                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-cyan-50 transition-colors">
                                                    <CalendarIcon className="w-6 h-6 text-gray-600 group-hover:text-cyan-600" />
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold text-cyan-700 mb-4">
                                                {getPrice(standardInstallation)} Lei
                                            </div>
                                            <ul className="space-y-2 mb-6">
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-green-500" /> Traseu frigorific 3m
                                                </li>
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-green-500" /> Suport aparat exterior
                                                </li>
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-green-500" /> Aspirator profesional
                                                </li>
                                            </ul>
                                            <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition">
                                                Alege Standard
                                            </button>
                                        </div>

                                        {/* Premium Option */}
                                        <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-purple-500 transition-all cursor-pointer group"
                                            onClick={() => handleAddToCart(premiumInstallation)}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">Instalare Premium</h3>
                                                    <p className="text-sm text-gray-500">Materiale superioare + beneficii</p>
                                                </div>
                                                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-purple-50 transition-colors">
                                                    <Check className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold text-purple-700 mb-4">
                                                {getPrice(premiumInstallation)} Lei
                                            </div>
                                            <ul className="space-y-2 mb-6">
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-purple-500" /> Tot ce include Standard
                                                </li>
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-purple-500" /> Canal special pentru traseu
                                                </li>
                                                <li className="text-sm text-gray-600 flex gap-2">
                                                    <Check className="w-4 h-4 text-purple-500" /> Acoperirea găurii cu materiale de construcții
                                                </li>
                                            </ul>
                                            <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                                                Alege Premium
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Navigation */}
                            {step === 2 && (
                                <div className="bg-gray-50 p-4 border-t flex justify-start">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Înapoi la Calendar
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
