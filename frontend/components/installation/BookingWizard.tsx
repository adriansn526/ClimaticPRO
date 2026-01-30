'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Check,
  MapPin, Phone, Mail, User, Building2,
  Package, Zap, Shield, CheckCircle2, AlertCircle,
  Home, Layers, MessageSquare, ShoppingCart
} from 'lucide-react';
import { format, addDays, isSameDay, isWeekend, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';

// Types
interface DayBooking {
  date: Date;
  bookingsCount: number;
  maxBookings: number;
  isAvailable: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  btu: number;
  price: number;
  priceWithInstallation: number;
  energyClass: string;
  image: string;
  badge?: string;
  features: string[];
  brand?: string;
  stockStatus?: string;
}

interface BookingData {
  // Step 1: Calendar
  selectedDate: Date | null;

  // Step 2: Detalii + Aparat
  hasOwnDevice: boolean;
  selectedProduct: Product | null;
  roomType: string;
  floor: string;
  observations: string;

  // Step 3: Contact
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  building: string;
  apartment: string;
  sector: string;
  intercom: string;

  // Step 4: Confirmare
  gdprAccepted: boolean;
  marketingAccepted: boolean;
}


const ROOM_TYPES = [
  { value: 'living', label: 'Living', icon: '🛋️' },
  { value: 'bedroom', label: 'Dormitor', icon: '🛏️' },
  { value: 'office', label: 'Birou', icon: '💼' },
  { value: 'kitchen', label: 'Bucătărie', icon: '🍳' },
  { value: 'other', label: 'Altele', icon: '🏠' },
];

export default function BookingWizard({ compact = false }: { compact?: boolean }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BookingData>({
    selectedDate: null,
    hasOwnDevice: false,
    selectedProduct: null,
    roomType: '',
    floor: '',
    observations: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    building: '',
    apartment: '',
    sector: '',
    intercom: '',
    gdprAccepted: false,
    marketingAccepted: false,
  });

  // Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/installation');
        const data = await response.json();

        if (data.success && data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Load calendar data
  useEffect(() => {
    const generateBookings = async () => {
      setLoading(true);
      const days: DayBooking[] = [];
      const today = startOfDay(new Date());
      const maxBookingsPerDay = 3;

      for (let i = 1; i <= 30; i++) {
        const date = addDays(today, i);
        const bookingsCount = Math.floor(Math.random() * (maxBookingsPerDay + 1));

        days.push({
          date,
          bookingsCount,
          maxBookings: maxBookingsPerDay,
          isAvailable: !isWeekend(date) && bookingsCount < maxBookingsPerDay,
        });
      }

      setBookings(days);
      setLoading(false);
    };

    generateBookings();
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bookingData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (field: keyof BookingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.selectedDate) {
        newErrors.selectedDate = 'Selectează o dată pentru instalare';
      }
    }

    if (step === 2) {
      if (!formData.hasOwnDevice && !formData.selectedProduct) {
        newErrors.selectedProduct = 'Selectează un aparat sau bifează că ai deja unul';
      }
      if (!formData.roomType) {
        newErrors.roomType = 'Selectează tipul camerei';
      }
    }

    if (step === 3) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Prenumele este obligatoriu';
      if (!formData.lastName.trim()) newErrors.lastName = 'Numele este obligatoriu';
      if (!formData.phone.trim()) newErrors.phone = 'Telefonul este obligatoriu';
      if (!formData.email.trim()) newErrors.email = 'Email-ul este obligatoriu';
      if (!formData.street.trim()) newErrors.street = 'Strada este obligatorie';
      if (!formData.number.trim()) newErrors.number = 'Numărul este obligatoriu';
      if (!formData.sector.trim()) newErrors.sector = 'Sectorul este obligatoriu';
    }

    if (step === 4) {
      if (!formData.gdprAccepted) {
        newErrors.gdprAccepted = 'Trebuie să accepți termenii și condițiile';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings/woocommerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('bookingData');
        window.location.href = `/instalare/confirmare?order=${data.orderId}`;
      } else {
        setErrors({ submit: data.error || 'A apărut o eroare. Te rugăm să încerci din nou.' });
      }
    } catch (error) {
      setErrors({ submit: 'Eroare de conexiune. Verifică internetul și încearcă din nou.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getDayStatus = (day: DayBooking) => {
    if (isWeekend(day.date)) {
      return { color: 'bg-gray-100 text-gray-400 cursor-not-allowed', label: 'Weekend' };
    }
    if (day.bookingsCount >= day.maxBookings) {
      return { color: 'bg-red-50 text-red-400 cursor-not-allowed', label: 'Complet' };
    }
    if (day.bookingsCount >= day.maxBookings - 1) {
      return { color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer', label: 'Ultimul loc' };
    }
    return { color: 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer', label: 'Disponibil' };
  };

  const calculateTotal = () => {
    const installationPrice = 1000;
    const productPrice = formData.selectedProduct?.price || 0;
    return formData.hasOwnDevice ? installationPrice : (formData.selectedProduct?.priceWithInstallation || installationPrice);
  };

  return (
    <section id="booking-wizard" className={compact ? "w-full" : "py-16 bg-gray-50"}>
      <div className={compact ? "w-full" : "container mx-auto px-4"}>
        <div className={compact ? "w-full" : "max-w-4xl mx-auto"}>
          {/* Progress Bar - Compact vs Full */}
          {compact ? (
            <div className="mb-4 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          ) : (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${currentStep >= step
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-cyan-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-600">
                <span className={currentStep === 1 ? 'text-cyan-600 font-bold' : ''}>Calendar</span>
                <span className={currentStep === 2 ? 'text-cyan-600 font-bold' : ''}>Detalii</span>
                <span className={currentStep === 3 ? 'text-cyan-600 font-bold' : ''}>Contact</span>
                <span className={currentStep === 4 ? 'text-cyan-600 font-bold' : ''}>Confirmare</span>
              </div>
            </div>
          )}

          {/* Wizard Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`bg-white rounded-xl shadow-none ${compact ? 'p-2' : 'p-6 sm:p-8'}`}
          >
            <AnimatePresence mode="wait">
              {/* STEP 1: Calendar */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className={`${compact ? 'text-sm' : 'text-2xl sm:text-3xl'} font-bold text-gray-900`}>
                      selectează ziua:
                    </h2>
                    {compact && (
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /> <span className="text-[10px] text-gray-500">Liber</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-500" /> <span className="text-[10px] text-gray-500">Lim.</span></div>
                      </div>
                    )}
                  </div>

                  {!compact && (
                    <p className="text-base mb-6 text-gray-600">Instalăm în 1-3 zile.</p>
                  )}

                  {!compact && (
                    <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-50 border-2 border-green-600" />
                        <span className="text-xs text-gray-600">Liber</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-orange-50 border-2 border-orange-600" />
                        <span className="text-xs text-gray-600">Ultimul loc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-50 border-2 border-red-400" />
                        <span className="text-sm text-gray-600">Complet</span>
                      </div>
                    </div>
                  )}

                  {/* Calendar Grid */}
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className={`grid ${compact ? 'grid-cols-5 gap-1 mb-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6'}`}>
                      {(compact ? bookings.slice(0, 15) : bookings).map((day, index) => {
                        const status = getDayStatus(day);
                        const isSelected = formData.selectedDate && isSameDay(day.date, formData.selectedDate);

                        return (
                          <button
                            key={index}
                            onClick={() => day.isAvailable && updateFormData('selectedDate', day.date)}
                            disabled={!day.isAvailable}
                            className={`
                              relative rounded border transition-all flex flex-col items-center justify-center
                              ${compact ? 'p-1 h-14' : 'p-4'}
                              ${status.color}
                              ${isSelected ? 'border-cyan-600 ring-1 ring-cyan-200 bg-cyan-50' : 'border-transparent'}
                              ${day.isAvailable ? 'hover:scale-[1.02]' : ''}
                            `}
                          >
                            <div className={`${compact ? 'text-[9px] uppercase tracking-tighter' : 'text-xs'} font-bold mb-0 opacity-80`}>
                              {format(day.date, 'EEE', { locale: ro })}
                            </div>
                            <div className={`${compact ? 'text-lg' : 'text-2xl'} font-bold leading-none`}>
                              {format(day.date, 'd')}
                            </div>

                            {!compact && (
                              <div className="text-xs">
                                {format(day.date, 'MMM', { locale: ro })}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Expand Button if Compact */}
                  {compact && (
                    <button onClick={() => { }} className="w-full text-center text-[10px] text-cyan-600 font-bold hover:underline py-1">
                      Vezi mai multe zile...
                    </button>
                  )}

                  {formData.selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-cyan-50 rounded border border-cyan-200 mt-1 ${compact ? 'p-1.5' : 'p-4'}`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <p className={`font-bold text-cyan-800 ${compact ? 'text-xs' : ''}`}>
                          ✅ {format(formData.selectedDate, 'd MMMM', { locale: ro })}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {errors.selectedDate && (
                    <p className="mt-1 text-[10px] text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.selectedDate}
                    </p>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Detalii + Aparat */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Detalii Instalare
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Selectează aparatul și oferă-ne detalii despre locația instalării.
                  </p>

                  {/* Toggle: Am aparat / Vreau să cumpăr */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ai deja aparat sau vrei să cumperi de la noi?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          updateFormData('hasOwnDevice', true);
                          updateFormData('selectedProduct', null);
                        }}
                        className={`
                          p-4 rounded-xl border-2 transition-all font-semibold
                          ${formData.hasOwnDevice
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        <Package className="w-6 h-6 mx-auto mb-2" />
                        Am deja aparat
                      </button>
                      <button
                        onClick={() => updateFormData('hasOwnDevice', false)}
                        className={`
                          p-4 rounded-xl border-2 transition-all font-semibold relative
                          ${!formData.hasOwnDevice
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                        Vreau să cumpăr
                        {/* Free Installation Badge */}
                        {!compact && (
                          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Montaj Gratuit
                          </span>
                        )}
                      </button>
                    </div>
                    {!formData.hasOwnDevice && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs sm:text-sm text-blue-800 text-center">
                        🚀 <strong>Super Ofertă:</strong> Cumperi de la noi, noi venim și îl montăm în aceeași zi cu livrarea!
                      </div>
                    )}
                    {formData.hasOwnDevice && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-xs sm:text-sm text-green-800 text-center">
                        ✅ <strong>Instalare Rapidă:</strong> Ai deja aparatul? Nici o problemă, îl montăm noi profesional!
                      </div>
                    )}
                  </div>

                  {/* Product Selection (dacă nu are aparat) */}
                  {!formData.hasOwnDevice && (
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Selectează aparatul dorit
                      </label>
                      {loadingProducts ? (
                        <div className="text-center py-12">
                          <div className="inline-block w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                          <p className="mt-4 text-gray-600">Se încarcă produsele...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">Nu sunt produse disponibile momentan.</p>
                          <p className="text-sm text-gray-500 mt-2">Te rugăm să ne contactezi telefonic.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {products.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => updateFormData('selectedProduct', product)}
                              className={`
                              relative p-4 rounded-xl border-2 transition-all text-left
                              ${formData.selectedProduct?.id === product.id
                                  ? 'border-cyan-600 bg-cyan-50 ring-4 ring-cyan-200'
                                  : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-lg'
                                }
                            `}
                            >
                              {product.badge && (
                                <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {product.badge}
                                </span>
                              )}

                              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                <Zap className="w-12 h-12 text-gray-400" />
                              </div>

                              <h3 className="font-bold text-gray-900 mb-1 text-sm">{product.name}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-cyan-600">{product.btu} BTU</span>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">
                                  {product.energyClass}
                                </span>
                              </div>

                              <div className="mb-2">
                                <p className="text-xs text-gray-500 line-through">{product.price} RON</p>
                                <p className="text-lg font-bold text-cyan-600">
                                  {product.priceWithInstallation.toLocaleString()} RON
                                </p>
                                <p className="text-xs text-green-700 font-semibold">
                                  cu instalare inclusă
                                </p>
                              </div>

                              {formData.selectedProduct?.id === product.id && (
                                <div className="absolute -top-2 -left-2 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.selectedProduct && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.selectedProduct}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Room Type */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tipul camerei
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {ROOM_TYPES.map((room) => (
                        <button
                          key={room.value}
                          onClick={() => updateFormData('roomType', room.value)}
                          className={`
                            p-3 rounded-lg border-2 transition-all
                            ${formData.roomType === room.value
                              ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="text-2xl mb-1">{room.icon}</div>
                          <div className="text-xs font-semibold">{room.label}</div>
                        </button>
                      ))}
                    </div>
                    {errors.roomType && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.roomType}
                      </p>
                    )}
                  </div>

                  {/* Floor */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Etaj (opțional)
                    </label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => updateFormData('floor', e.target.value)}
                      placeholder="ex: Etaj 3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                    />
                  </div>

                  {/* Observations */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observații (opțional)
                    </label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => updateFormData('observations', e.target.value)}
                      placeholder="Detalii suplimentare despre instalare..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Contact */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Date de Contact
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Completează datele tale pentru a finaliza programarea.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prenume *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="Ion"
                        />
                      </div>
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nume *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="Popescu"
                        />
                      </div>
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Telefon *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="0712 345 678"
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="ion.popescu@email.ro"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-cyan-600" />
                      Adresa Instalării
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Strada *
                        </label>
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) => updateFormData('street', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${errors.street ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="Strada Aviatorilor"
                        />
                        {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Număr *
                        </label>
                        <input
                          type="text"
                          value={formData.number}
                          onChange={(e) => updateFormData('number', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${errors.number ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="25"
                        />
                        {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Bloc
                        </label>
                        <input
                          type="text"
                          value={formData.building}
                          onChange={(e) => updateFormData('building', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                          placeholder="A1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Apartament
                        </label>
                        <input
                          type="text"
                          value={formData.apartment}
                          onChange={(e) => updateFormData('apartment', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                          placeholder="12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sector *
                        </label>
                        <select
                          value={formData.sector}
                          onChange={(e) => updateFormData('sector', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${errors.sector ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                        >
                          <option value="">Alege</option>
                          {[1, 2, 3, 4, 5, 6].map(s => (
                            <option key={s} value={`Sector ${s}`}>Sector {s}</option>
                          ))}
                          <option value="Ilfov">Ilfov</option>
                        </select>
                        {errors.sector && <p className="mt-1 text-sm text-red-600">{errors.sector}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interfon
                      </label>
                      <input
                        type="text"
                        value={formData.intercom}
                        onChange={(e) => updateFormData('intercom', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                        placeholder="Cod interfon sau nume"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Confirmare */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Confirmă Programarea
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Verifică datele și finalizează comanda.
                  </p>

                  {/* Summary */}
                  <div className="space-y-4 mb-6">
                    {/* Date */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Data Instalării
                      </h3>
                      <p className="text-gray-700">
                        {formData.selectedDate && format(formData.selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}
                      </p>
                      <p className="text-sm text-gray-600">Program: 09:00 - 17:00</p>
                    </div>

                    {/* Product/Service */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-600" />
                        Servicii
                      </h3>
                      {formData.hasOwnDevice ? (
                        <p className="text-gray-700">Instalare aer condiționat (aparat propriu)</p>
                      ) : (
                        <>
                          <p className="text-gray-700 font-semibold">{formData.selectedProduct?.name}</p>
                          <p className="text-sm text-gray-600">Include instalare completă</p>
                        </>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Camera: {ROOM_TYPES.find(r => r.value === formData.roomType)?.label}
                        {formData.floor && ` • ${formData.floor}`}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-600" />
                        Date Contact
                      </h3>
                      <p className="text-gray-700">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-gray-600">{formData.phone}</p>
                      <p className="text-sm text-gray-600">{formData.email}</p>
                    </div>

                    {/* Address */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-cyan-600" />
                        Adresa Instalării
                      </h3>
                      <p className="text-gray-700">
                        {formData.street} {formData.number}
                        {formData.building && `, Bl. ${formData.building}`}
                        {formData.apartment && `, Ap. ${formData.apartment}`}
                      </p>
                      <p className="text-sm text-gray-600">{formData.sector}, București</p>
                    </div>

                    {/* Total */}
                    <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold text-gray-900">Total de plată:</span>
                        <span className="text-3xl font-bold text-cyan-600">{calculateTotal().toLocaleString()} RON</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.hasOwnDevice
                          ? 'Include: Kit instalare 3m + Manoperă + Garanție montaj'
                          : 'Include: Aparat + Kit instalare 3m + Manoperă + Garanție montaj'
                        }
                      </p>
                    </div>
                  </div>

                  {/* GDPR */}
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gdprAccepted}
                        onChange={(e) => updateFormData('gdprAccepted', e.target.checked)}
                        className="mt-1 w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700">
                        Accept <a href="/termeni" className="text-cyan-600 hover:underline">termenii și condițiile</a> și <a href="/confidentialitate" className="text-cyan-600 hover:underline">politica de confidențialitate</a> *
                      </span>
                    </label>
                    {errors.gdprAccepted && (
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.gdprAccepted}
                      </p>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.marketingAccepted}
                        onChange={(e) => updateFormData('marketingAccepted', e.target.checked)}
                        className="mt-1 w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700">
                        Doresc să primesc oferte și promoții pe email
                      </span>
                    </label>
                  </div>

                  {errors.submit && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {errors.submit}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 font-semibold hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Înapoi
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Continuă
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Finalizează Comanda
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Trust Signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Plată securizată</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Garanție montaj</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              <span>Suport 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
