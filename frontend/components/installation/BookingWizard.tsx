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
import { usePostHog } from 'posthog-js/react';
import { Loader2 } from 'lucide-react';

// Types
interface DayBooking {
  date: Date;
  bookingsCount: number;
  maxBookings: number;
  isAvailable: boolean;
  isScarce?: boolean;
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

  // Step 3: Contact & Billing
  billingType: 'fizica' | 'juridica';
  companyName?: string;
  cui?: string;
  regCom?: string;
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
  quantity: number;
  selectedService: string;
}

const SERVICES = [
  {
    id: 'standard',
    title: 'Instalare Standard',
    price: 1000,
    regularPrice: null as number | null,
    description: 'Traseu frigorific 3m inclusiv, perforare, consola, vacuum.',
    features: ['Montaj unitate internă/externă', 'Traseu 3 metri', 'Proba de funcționare'],
    popular: true
  },
  {
    id: 'premium',
    title: 'Instalare Premium',
    price: 1250,
    regularPrice: null as number | null,
    description: 'Include materiale premium, traseu estompat, curățenie avansată.',
    features: ['Tot ce include varianta standard', 'Mască plastic traseu interior', 'Aspirare praf profesională'],
    popular: false
  }
];

const ROOM_TYPES = [
  { value: 'living', label: 'Living', icon: '🛋️' },
  { value: 'bedroom', label: 'Dormitor', icon: '🛏️' },
  { value: 'office', label: 'Birou', icon: '💼' },
  { value: 'kitchen', label: 'Bucătărie', icon: '🍳' },
  { value: 'other', label: 'Altele', icon: '🏠' },
];

export default function BookingWizard({ compact = false, preSelectedProduct, preSelectedQuantity = 1 }: { compact?: boolean; preSelectedProduct?: Product | null, preSelectedQuantity?: number }) {
  const posthog = usePostHog();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingCompany, setFetchingCompany] = useState(false);
  const [expandedCalendar, setExpandedCalendar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BookingData>({
    selectedDate: null,
    hasOwnDevice: false,
    selectedProduct: null,
    roomType: '',
    floor: '',
    observations: '',
    billingType: 'fizica',
    companyName: '',
    cui: '',
    regCom: '',
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
    quantity: 1,
    selectedService: 'standard',
  });

  const [installationPrice, setInstallationPrice] = useState(1000); // Default fallback
  const [servicesData, setServicesData] = useState(SERVICES);

  // Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/installation');
        const data = await response.json();

        if (data.success) {
          if (data.products) setProducts(data.products);
          if (data.installationPrice) setInstallationPrice(data.installationPrice);
          if (data.servicePackages) {
            setServicesData(prev => prev.map(s => {
              if (s.id === 'standard' && data.servicePackages.standard) {
                s.price = data.servicePackages.standard.price;
                s.regularPrice = data.servicePackages.standard.regularPrice;
              }
              if (s.id === 'premium' && data.servicePackages.premium) {
                s.price = data.servicePackages.premium.price;
                s.regularPrice = data.servicePackages.premium.regularPrice;
              }
              return s;
            }));
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Load real calendar availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      let busySlots: any[] = [];
      let scarceSlots: any[] = [];
      const today = startOfDay(new Date());

      try {
        const endDate = addDays(today, 30);

        // Fetch busy slots from API
        const response = await fetch(`/api/calendar/availability?timeMin=${today.toISOString()}&timeMax=${endDate.toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          busySlots = data.busySlots || [];
          scarceSlots = data.scarceSlots || [];
        }
      } catch (error) {
        console.error('Error loading calendar availability:', error);
      }

      const days: DayBooking[] = [];
      const maxBookingsPerDay = 3;

      for (let i = 1; i <= 30; i++) {
        const date = addDays(today, i);
        // Check if there are any busy slots for this day
        const isBusy = busySlots.some((slot: any) => {
          const slotStart = new Date(slot.start);
          return isSameDay(date, slotStart);
        });

        const isScarce = scarceSlots.some((slot: any) => {
          const slotStart = new Date(slot.start);
          return isSameDay(date, slotStart);
        });

        // Use busy slot info mainly. 
        const bookingsCount = isBusy ? maxBookingsPerDay : 0;

        days.push({
          date,
          bookingsCount,
          maxBookings: maxBookingsPerDay,
          isAvailable: !isWeekend(date) && !isBusy,
          isScarce: isScarce && !isBusy,
        });
      }

      setBookings(days);
      setLoading(false);
    };

    fetchAvailability();
  }, []);

  // Handle pre-selected product
  useEffect(() => {
    if (preSelectedProduct) {
      setFormData(prev => ({
        ...prev,
        selectedProduct: preSelectedProduct,
        hasOwnDevice: false,
        quantity: preSelectedQuantity
      }));
      // User requested to be guided to select date in calendar (Step 1)
      // So we stay on Step 1, but we ensure formData has product.
      // Logic in nextStep() will handle skipping Step 2.

      setCurrentStep(1);

      // Scroll to wizard if needed
      const element = document.getElementById('booking-wizard');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [preSelectedProduct, preSelectedQuantity]);

  const handleCuiLookup = async (cui: string) => {
    if (!cui || cui.length < 2) return;
    setFetchingCompany(true);
    try {
      const res = await fetch('/api/companie', {
        method: 'POST',
        body: JSON.stringify({ cui })
      });
      const data = await res.json();
      if (data.success && data.company) {
        updateFormData({
          companyName: data.company.name,
          regCom: data.company.regCom || formData.regCom
        });
      }
    } catch (error) {
      console.error("Nu am putut prelua datele companiei", error);
    } finally {
      setFetchingCompany(false);
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bookingData', JSON.stringify(formData));
  }, [formData]);

  // Track if they have started the form
  useEffect(() => {
    if (currentStep === 2) {
      posthog?.capture('installation_form_started', {
        date_selected: formData.selectedDate
      });
    }
  }, [currentStep, formData.selectedDate, posthog]);

  const updateFormData = (field: keyof BookingData | Partial<BookingData>, value?: any) => {
    if (typeof field === 'string') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else if (typeof field === 'object') {
      setFormData(prev => ({ ...prev, ...field }));
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(field).forEach(k => { delete newErrors[k]; });
        return newErrors;
      });
    }
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
      if (formData.hasOwnDevice && !formData.selectedService) {
        newErrors.selectedService = 'Selectează tipul de instalare dorit';
      }
      // Moved roomType to step 3
    }

    if (step === 3) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Prenumele este obligatoriu';
      if (!formData.lastName.trim()) newErrors.lastName = 'Numele este obligatoriu';
      if (!formData.phone.trim()) newErrors.phone = 'Telefonul este obligatoriu';
      if (!formData.email.trim()) newErrors.email = 'Email-ul este obligatoriu';

      if (formData.billingType === 'juridica') {
        if (!formData.companyName?.trim()) newErrors.companyName = 'Numele firmei este obligatoriu';
        if (!formData.cui?.trim()) newErrors.cui = 'CUI-ul este obligatoriu';
      }

      if (!formData.street.trim()) newErrors.street = 'Strada este obligatorie';
      if (!formData.number.trim()) newErrors.number = 'Numărul este obligatoriu';
      if (!formData.sector.trim()) newErrors.sector = 'Sectorul este obligatoriu';

      // Added validation for moved fields
      if (!formData.roomType) {
        newErrors.roomType = 'Selectează tipul camerei';
      }
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
      // Logic for pre-selected product
      if (currentStep === 1 && preSelectedProduct) {
        // Skip Step 2 (Product Selection) if product is pre-selected from Hero
        setCurrentStep(3);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
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
      // Calculate Installation Fee
      let installationFee = 0;
      if (formData.hasOwnDevice) {
        const selectedSrv = servicesData.find(s => s.id === formData.selectedService);
        installationFee = selectedSrv ? selectedSrv.price : 1000;
      } else if (formData.selectedProduct) {
        // Difference between Package Price and Base Product Price
        installationFee = (formData.selectedProduct.priceWithInstallation || 0) - (formData.selectedProduct.price || 0);
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, installationFee }),
      });

      const data = await response.json();

      if (response.ok) {
        posthog?.capture('installation_form_submitted', {
          order_id: data.orderId,
          total_value: calculateTotal(),
          has_own_device: formData.hasOwnDevice,
          selected_service: formData.selectedService,
          product_id: formData.selectedProduct?.id,
          product_name: formData.selectedProduct?.name,
          quantity: formData.quantity || 1
        });

        // Do NOT remove bookingData here, we need it for the confirmation page PDF !
        // localStorage.removeItem('bookingData'); 
        window.location.href = `/instalare/confirmare?order=${data.orderId}`;
      } else {
        const errorMessage = data.error || 'A apărut o eroare. Te rugăm să încerci din nou.';
        console.error('Submit Error:', errorMessage);
        alert(`Eroare: ${errorMessage}`);
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      setErrors({ submit: 'Eroare de conexiune. Verifică internetul și încearcă din nou.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getDayStatus = (day: DayBooking) => {
    if (isWeekend(day.date)) return { color: 'bg-gray-100 text-gray-400 cursor-not-allowed', label: 'Weekend' };
    if (day.bookingsCount >= day.maxBookings || !day.isAvailable) return { color: 'bg-red-50 text-red-500 cursor-not-allowed', label: 'Complet' };
    if (day.isScarce) return { color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer border-orange-200 ring-1 ring-orange-200', label: '1 Loc' };
    return { color: 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer', label: 'Liber' };
  };

  const calculateTotal = () => {
    const qty = formData.quantity || 1;
    if (formData.hasOwnDevice) {
      const selectedSrv = servicesData.find(s => s.id === formData.selectedService);
      return (selectedSrv ? selectedSrv.price : installationPrice) * qty;
    } else {
      return (formData.selectedProduct?.priceWithInstallation || 0) * qty;
    }
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
                      {(compact && !expandedCalendar ? bookings.slice(0, 15) : bookings).map((day, index) => {
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
                            <span className={`font-bold ${compact ? 'text-xs' : 'text-lg'} ${isSelected ? 'text-cyan-700' : ''}`}>
                              {format(day.date, 'd', { locale: ro })}
                            </span>
                            <span className={`text-[10px] uppercase ${compact ? 'block text-[9px] opacity-75' : 'block'} ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`}>
                              {format(day.date, 'EEE', { locale: ro })}
                            </span>
                            {day.isScarce && !compact && (
                                <span className="absolute -bottom-2 text-[9px] font-bold text-orange-700 bg-orange-100 px-1 rounded-sm shadow-sm opacity-90">1 loc</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Expand Button if Compact */}
                  {compact && !loading && (
                    <button
                      type="button"
                      onClick={() => setExpandedCalendar(!expandedCalendar)}
                      className="w-full text-center text-[10px] text-cyan-600 font-bold hover:underline py-1"
                    >
                      {expandedCalendar ? 'Vezi mai puține zile...' : 'Vezi mai multe zile...'}
                    </button>
                  )}

                  {formData.selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-cyan-50 rounded border border-cyan-200 mt-1 ${compact ? 'p-1.5' : 'p-4'}`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <p className={`font-bold text-cyan-800 ${compact ? 'text-xs' : ''} `}>
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
                    Detalii Montaj Aer Condiționat
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Selectează dacă vrei un aparat de aer condiționat cu montaj inclus sau doar serviciul de instalare.
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
                    {formData.hasOwnDevice && (
                      <div className="mt-6 mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Selectează pachetul de instalare dorit pentru aparatul tău
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {servicesData.map((service) => (
                            <div
                              role="button"
                              key={service.id}
                              onClick={() => updateFormData('selectedService', service.id)}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col h-full
                                ${formData.selectedService === service.id
                                  ? 'border-cyan-600 bg-cyan-50 ring-4 ring-cyan-200'
                                  : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-lg'}
                              `}
                            >
                              {service.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-md">
                                  Cel mai popular
                                </span>
                              )}
                              <div className="flex justify-between items-start mb-2 mt-2">
                                <h3 className="font-bold text-lg text-gray-900">{service.title}</h3>
                                <div className="text-right">
                                  {service.regularPrice && service.regularPrice > service.price && (
                                    <span className="block text-sm text-gray-500 line-through">
                                      {service.regularPrice} Lei
                                    </span>
                                  )}
                                  <span className="text-xl font-bold text-cyan-700">{service.price} Lei</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

                              <ul className="mt-auto space-y-2">
                                {service.features.map((feat, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>

                              {formData.selectedService === service.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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
                        <div className={`grid gap-4 ${products.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                          {products.map((product) => (
                            <div
                              role="button"
                              key={product.id}
                              onClick={() => updateFormData('selectedProduct', product)}
                              className={`
                              relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col h-full
                              ${products.length === 1 ? 'md:flex-row md:items-start md:gap-6' : 'text-left'}
                              ${formData.selectedProduct?.id === product.id
                                  ? 'border-cyan-600 bg-cyan-50 ring-4 ring-cyan-200'
                                  : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-lg'
                                }
                        `}
                            >
                              {product.badge && (
                                <span className={`absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full ${products.length === 1 ? 'z-10' : ''}`}>
                                  {product.badge}
                                </span>
                              )}

                              <div className={`aspect-square bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${products.length === 1 ? 'w-full md:w-1/3 mb-4 md:mb-0' : 'mb-3'}`}>
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
                                ) : (
                                  <Zap className="w-12 h-12 text-gray-400" />
                                )}
                              </div>

                              <div className={`flex flex-col flex-1 justify-between w-full ${products.length === 1 ? 'text-left' : ''}`}>
                                <div>
                                  <h3 className={`font-bold text-gray-900 mb-2 ${products.length === 1 ? 'text-lg' : 'text-sm'}`}>{product.name}</h3>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{product.btu} BTU</span>
                                    <span className="text-sm px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold border border-green-200">
                                      {product.energyClass}
                                    </span>
                                  </div>

                                  {/* Puncte cheie (Features) */}
                                  {product.features && product.features.length > 0 && (
                                    <ul className={`mb-4 space-y-1 ${products.length === 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1' : ''}`}>
                                      {product.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                          <span>{feature}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                <div className={`pt-3 border-t border-gray-100 ${products.length === 1 ? 'flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto' : 'mt-auto'}`}>
                                  <div>
                                    {/* Display base price normally */}
                                    <p className="text-xs text-gray-500 font-medium mb-1">
                                      Preț aparat: {formData.selectedProduct?.id === product.id ? ((product.price || 0) * (formData.quantity || 1)).toLocaleString() : product.price} RON
                                    </p>
                                    <div className="text-xl font-bold text-cyan-600 mb-1">
                                      {formData.selectedProduct?.id === product.id
                                        ? ((product.priceWithInstallation || 0) * (formData.quantity || 1)).toLocaleString()
                                        : product.priceWithInstallation?.toLocaleString()
                                      } Lei
                                      <span className="text-xs text-gray-400 font-normal block mt-0.5">
                                        TVA inclus • Montaj Standard
                                      </span>
                                    </div>
                                  </div>

                                  <div className={`flex flex-col gap-2 ${products.length === 1 ? 'w-full sm:w-auto min-w-[200px]' : ''}`}>
                                    {/* Quantity Selector inside Product Card if selected */}
                                    {formData.selectedProduct?.id === product.id && (
                                      <div className="flex items-center justify-between gap-3 bg-white border border-cyan-100 p-1.5 rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-xs font-semibold text-gray-600 pl-2">Cantitate:</span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newQty = Math.max(1, (formData.quantity || 1) - 1);
                                              updateFormData({ quantity: newQty });
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-gray-50 border border-gray-200 rounded hover:border-cyan-500 hover:text-cyan-600 text-gray-800 transition-colors"
                                          >-</button>
                                          <span className="font-bold w-6 text-center text-gray-900">{formData.quantity || 1}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newQty = (formData.quantity || 1) + 1;
                                              updateFormData({ quantity: newQty });
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-gray-50 border border-gray-200 rounded hover:border-cyan-500 hover:text-cyan-600 text-gray-800 transition-colors"
                                          >+</button>
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateFormData({ selectedProduct: product, hasOwnDevice: false, quantity: formData.quantity || 1 });
                                        nextStep();
                                      }}
                                      className="w-full py-2.5 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 hover:shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                      <span>Selectează și Continuă</span>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {formData.selectedProduct?.id === product.id && (
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-cyan-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
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

                </motion.div>
              )}

              {/* STEP 3: Contact + Detalii Locație */}
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

                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6 inline-flex">
                    <button
                      onClick={() => updateFormData('billingType', 'fizica')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${formData.billingType === 'fizica' ? 'bg-white shadow-sm text-cyan-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Persoană Fizică
                    </button>
                    <button
                      onClick={() => updateFormData('billingType', 'juridica')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${formData.billingType === 'juridica' ? 'bg-white shadow-sm text-cyan-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Persoană Juridică
                    </button>
                  </div>

                  {formData.billingType === 'juridica' && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mb-6 space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-cyan-600" /> Date Societate
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">CUI / CIF *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.cui}
                              onChange={(e) => updateFormData('cui', e.target.value)}
                              onBlur={() => handleCuiLookup(formData.cui || '')}
                              className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.cui ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'} focus:ring-4 focus:ring-cyan-100`}
                              placeholder="RO12345678"
                            />
                            {fetchingCompany && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                              </div>
                            )}
                          </div>
                          {errors.cui ? <p className="mt-1 text-sm text-red-600">{errors.cui}</p> : <p className="mt-1 text-xs text-gray-500">Numele firmei va fi preluat automat după completare.</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Denumire Firmă *</label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => updateFormData('companyName', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.companyName ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'} focus:ring-4 focus:ring-cyan-100`}
                            placeholder="Ex: SC CLIMATIC SRL"
                          />
                          {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nr. Reg. Comerțului</label>
                          <input
                            type="text"
                            value={formData.regCom}
                            onChange={(e) => updateFormData('regCom', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100`}
                            placeholder="J40/1234/2020"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
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
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
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
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
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
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                          placeholder="ion.popescu@email.ro"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="border-t pt-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-600" />
                      Detalii Locație
                    </h3>

                    {/* Room Type */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Tipul camerei *
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

                    {/* Floor & Observations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Etaj (opțional)
                        </label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => updateFormData('floor', e.target.value)}
                          placeholder="ex: Etaj 3"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Observații (opțional)
                        </label>
                        <input
                          type="text"
                          value={formData.observations}
                          onChange={(e) => updateFormData('observations', e.target.value)}
                          placeholder="Detalii..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all"
                        />
                      </div>
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
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.street ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
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
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.number ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all text-gray-900"
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all text-gray-900"
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
                          className={`w-full px-4 py-3 border-2 rounded-lg transition-all text-gray-900 ${errors.sector ? 'border-red-500' : 'border-gray-200 focus:border-cyan-500'
                            } focus:ring-4 focus:ring-cyan-100`}
                        >
                          <option value="">Alege</option>
                          {[1, 2, 3, 4, 5, 6].map(s => (
                            <option key={s} value={`Sector ${s} `}>Sector {s}</option>
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all text-gray-900"
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
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-gray-700 font-medium">Instalare aer condiționat (aparat propriu)</p>
                            <span className="font-bold text-gray-900 border-b">
                              {servicesData.find(s => s.id === formData.selectedService)?.price} RON
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Pachet ales: <span className="font-semibold text-cyan-700">{servicesData.find(s => s.id === formData.selectedService)?.title}</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                              Sumar Programare
                            </h2>
                            <p className="text-gray-600">
                              Verifică detaliile și confirmă programarea.
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Detalii Comandă</h3>

                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-600">Dată Instalare:</span>
                              <span className="font-bold text-gray-900">
                                {formData.selectedDate && format(formData.selectedDate, 'dd MMMM yyyy', { locale: ro })}
                              </span>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-600">Aparat:</span>
                              <span className="font-bold text-gray-900 text-right">
                                {formData.hasOwnDevice ? 'Am deja aparat' : formData.selectedProduct?.name}
                              </span>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-600">Locație:</span>
                              <span className="font-bold text-gray-900 text-right">
                                {ROOM_TYPES.find(r => r.value === formData.roomType)?.label || formData.roomType}
                                {formData.floor && `, ${formData.floor} `}
                              </span>
                            </div>

                            <div className="border-t pt-3 mt-3 flex justify-between items-center text-lg">
                              <span className="font-bold text-gray-900">Total Estimativ:</span>
                              <span className="font-bold text-cyan-600">
                                {calculateTotal().toLocaleString()} RON
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Terms & GDPR - Moved globally for Step 4 */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-cyan-600" />
                        Termeni și Condiții
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className={`
                        w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                        ${formData.gdprAccepted ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'}
                        `}>
                            {formData.gdprAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.gdprAccepted}
                            onChange={(e) => updateFormData('gdprAccepted', e.target.checked)}
                          />
                          <span className="text-sm text-gray-600">
                            Sunt de acord cu <a href="/termeni" className="text-cyan-600 hover:underline">Termenii și Condițiile</a> și prelucrarea datelor personale.
                          </span>
                        </label>
                        {errors.gdprAccepted && (
                          <p className="text-sm text-red-600 flex items-center gap-2 pl-2">
                            <AlertCircle className="w-4 h-4" />
                            {errors.gdprAccepted}
                          </p>
                        )}

                        <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className={`
                        w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                        ${formData.marketingAccepted ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'}
                        `}>
                            {formData.marketingAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.marketingAccepted}
                            onChange={(e) => updateFormData('marketingAccepted', e.target.checked)}
                          />
                          <span className="text-sm text-gray-600">
                            Doresc să primesc oferte speciale și noutăți pe email (opțional).
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Înapoi
                </button>
              )}

              <button
                onClick={currentStep === 4 ? handleSubmit : nextStep}
                disabled={submitting}
                className={`
                        px-8 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 ml-auto
                          ${submitting ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
              >
                {submitting ? (
                  <>Se trimite...</>
                ) : currentStep === 4 ? (
                  <>Confirmă Programarea <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>Pasul Următor <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </motion.div>

          {/* Trust Signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
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
