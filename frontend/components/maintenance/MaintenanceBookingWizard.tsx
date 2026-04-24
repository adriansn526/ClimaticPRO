'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Check, User, Wind, PenTool, AlertCircle
} from 'lucide-react';
import { format, addDays, isSameDay, isWeekend, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { usePostHog } from 'posthog-js/react';

interface DayBooking {
  date: Date;
  bookingsCount: number;
  maxBookings: number;
  isAvailable: boolean;
  isScarce?: boolean;
}

interface MaintenanceData {
  selectedDate: Date | null;
  selectedServices: string[];
  quantities: Record<string, number>;
  observations: string;

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
  gdprAccepted: boolean;
  createAccount: boolean;
  password?: string;
}

const SERVICES = [
  {
    id: 'igienizare_standard',
    title: 'Igienizare Standard',
    price: 150,
    description: 'Curățare filtre și carcasă frontală, igienizare vaporizator cu spray antibacterian.'
  },
  {
    id: 'igienizare_premium',
    title: 'Igienizare Premium',
    price: 290,
    description: 'Demontare carcasă unitate interioară, spălare cu presiune (husă), curățare turbină.'
  },
  {
    id: 'reparatie',
    title: 'Diagnoză și Reparație',
    price: 100,
    description: 'Stabilire defect (100 Lei). Costul final se comunică la fața locului în funcție de piesele necesare.'
  }
];

export default function MaintenanceBookingWizard({ compact = false }: { compact?: boolean }) {
  const posthog = usePostHog();
  const [currentStep, setCurrentStep] = useState(1);
  const [isModuleActive, setIsModuleActive] = useState(true);
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [services, setServices] = useState(SERVICES);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedCalendar, setExpandedCalendar] = useState(false);

  const [formData, setFormData] = useState<MaintenanceData>({
    selectedDate: null,
    selectedServices: ['igienizare_standard'],
    quantities: { 'igienizare_standard': 1, 'igienizare_premium': 1, 'reparatie': 1 },
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
    createAccount: false,
    password: '',
  });

  // Load calendar availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      let busySlots: any[] = [];
      let scarceSlots: any[] = [];
      const today = startOfDay(new Date());

      try {
        const endDate = addDays(today, 30);
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
      const maxBookingsPerDay = 5; // More slots for maintenance possibly

      for (let i = 1; i <= 30; i++) {
        const date = addDays(today, i);
        const isBusy = busySlots.some((slot: any) => isSameDay(date, new Date(slot.start)));
        const isScarce = scarceSlots.some((slot: any) => isSameDay(date, new Date(slot.start)));
        
        days.push({
          date,
          bookingsCount: isBusy ? maxBookingsPerDay : 0,
          maxBookings: maxBookingsPerDay,
          isAvailable: !isWeekend(date) && !isBusy,
          isScarce: isScarce && !isBusy,
        });
      }

      setBookings(days);
      setLoading(false);
    };

    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/admin/settings/pricing');
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.isMaintenanceActive === false) {
             setIsModuleActive(false);
          }
          setServices([
            {
              id: 'igienizare_standard',
              title: 'Igienizare Standard',
              price: data?.data?.maintenancePrice || 150,
              description: 'Curățare filtre și carcasă frontală, igienizare vaporizator cu spray antibacterian.'
            },
            {
              id: 'igienizare_premium',
              title: 'Igienizare Premium',
              price: data?.data?.maintenancePremiumPrice || 290,
              description: 'Demontare carcasă unitate interioară, spălare cu presiune (husă), curățare turbină.'
            },
            {
              id: 'reparatie',
              title: 'Diagnoză și Reparație',
              price: data?.data?.repairPrice || 100,
              description: `Stabilire defect (${data?.data?.repairPrice || 100} Lei). Costul final se comunică la fața locului în funcție de piesele necesare.`
            }
          ]);
        }
      } catch (e) {
        console.error('Pricing fetch failed', e);
      }
    };

    fetchAvailability();
    fetchPricing();
  }, []);

  const updateFormData = (field: keyof MaintenanceData | Partial<MaintenanceData>, value?: any) => {
    if (typeof field === 'string') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else if (typeof field === 'object') {
      setFormData(prev => ({ ...prev, ...field }));
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(field).forEach(k => delete newErrors[k]);
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !formData.selectedDate) {
      newErrors.selectedDate = 'Selectează o dată pentru intervenție';
    }

    if (step === 2) {
      if (formData.selectedServices.length === 0) newErrors.selectedServices = 'Selectează cel puțin un serviciu';
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
    }

    if (step === 4) {
      if (!formData.gdprAccepted) {
        newErrors.gdprAccepted = 'Trebuie să accepți termenii și condițiile';
      }
      if (formData.createAccount && (!formData.password || formData.password.length < 6)) {
        newErrors.password = 'Parola trebuie să aibă minim 6 caractere';
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

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      const selectedSrvs = services.filter(s => formData.selectedServices.includes(s.id));
      const combinedTitle = selectedSrvs.map(s => `${formData.quantities[s.id] || 1}x ${s.title}`).join(' + ');
      const totalBasePrice = selectedSrvs.reduce((sum, s) => sum + (s.price * (formData.quantities[s.id] || 1)), 0);
      
      const response = await fetch('/api/orders/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          isMaintenance: true,
          serviceName: combinedTitle,
          serviceTotal: totalBasePrice,
          servicesList: selectedSrvs.map(s => ({ 
              id: s.id, 
              name: s.title, 
              price: s.price, 
              quantity: formData.quantities[s.id] || 1 
          }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        posthog?.capture('maintenance_form_submitted');
        window.location.href = `/instalare/confirmare?order=${data.orderId}&mode=maintenance`;
      } else {
        alert(`Eroare: ${data.error || 'A apărut o eroare.'}`);
      }
    } catch (error) {
      alert('Eroare de conexiune. Verifică internetul și încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayStatus = (day: DayBooking) => {
    if (isWeekend(day.date)) return { color: 'bg-gray-100 text-gray-400 cursor-not-allowed', label: 'Weekend' };
    if (day.bookingsCount >= day.maxBookings || !day.isAvailable) return { color: 'bg-red-50 text-red-400 cursor-not-allowed', label: 'Complet' };
    if (day.isScarce) return { color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer border-orange-200 ring-1 ring-orange-200', label: '1 Loc' };
    return { color: 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer', label: 'Disponibil' };
  };

  if (!isModuleActive) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Urmează în curând!</h2>
        <p className="text-gray-600">Serviciile de mentenanță și reparații sunt momentan ascunse. Te rugăm să revii mai târziu sau să ne contactezi telefonic pentru programări.</p>
      </div>
    );
  }

  return (
    <section id="booking-wizard" className="w-full">
      <div className="bg-white rounded-xl shadow-2xl p-6 relative z-20">
        
        {/* Progress */}
        <div className="mb-6 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
          <div className="h-full bg-teal-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Date */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Alege Data Intervenției</h2>
              <div className="flex gap-2 justify-center mb-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /> <span className="text-gray-500">Liber</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-500" /> <span className="text-gray-500">Lim.</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400" /> <span className="text-gray-500">Complet</span></div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {(expandedCalendar ? bookings : bookings.slice(0, 15)).map((day, index) => {
                    const status = getDayStatus(day);
                    const isSelected = formData.selectedDate && isSameDay(day.date, formData.selectedDate);
                    return (
                      <button
                        key={index}
                        onClick={() => day.isAvailable && updateFormData('selectedDate', day.date)}
                        disabled={!day.isAvailable}
                        className={`relative rounded border transition-all flex flex-col items-center justify-center p-2 h-14 ${status.color} ${isSelected ? 'border-teal-600 ring-1 ring-teal-200 bg-teal-50' : 'border-transparent'}`}
                      >
                        <span className={`font-bold text-sm ${isSelected ? 'text-teal-700' : ''}`}>{format(day.date, 'd', { locale: ro })}</span>
                        <span className={`text-[9px] uppercase opacity-75 ${isSelected ? 'text-teal-600' : 'text-gray-500'}`}>{format(day.date, 'EEE', { locale: ro })}</span>
                        {day.isScarce && (
                           <span className="absolute -bottom-2 text-[8px] font-bold text-orange-700 bg-orange-100 px-[0.2rem] rounded-sm shadow-sm opacity-90">1 loc</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {!loading && (
                <button type="button" onClick={() => setExpandedCalendar(!expandedCalendar)} className="w-full text-center text-xs text-teal-600 font-bold hover:underline mb-4">
                  {expandedCalendar ? 'Vezi mai puține zile...' : 'Vezi mai multe zile...'}
                </button>
              )}

              {errors.selectedDate && <p className="text-xs text-red-600 text-center mb-2">{errors.selectedDate}</p>}

              <button onClick={nextStep} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition shadow-lg mt-2">
                Continuă
              </button>
            </motion.div>
          )}

          {/* STEP 2: Service Data */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Detalii Serviciu</h2>
              <div className="space-y-4 mb-6">
                {services.map((srv) => {
                  const isSelected = formData.selectedServices.includes(srv.id);
                  return (
                    <div key={srv.id} className="mb-4">
                      <div
                        onClick={() => {
                          let newServices = [...formData.selectedServices];
                          if (isSelected) {
                              newServices = newServices.filter(id => id !== srv.id);
                          } else {
                              newServices.push(srv.id);
                              if (srv.id.startsWith('igienizare_')) {
                                  newServices = newServices.filter(id => !(id.startsWith('igienizare_') && id !== srv.id));
                              }
                          }
                          updateFormData('selectedServices', newServices);
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isSelected ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-teal-300'}`}
                      >
                        <div className={`p-2 rounded-full ${isSelected ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {srv.id.startsWith('igienizare_') ? <Wind className="w-5 h-5"/> : <PenTool className="w-5 h-5"/>}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{srv.title}</h3>
                          <p className="text-sm text-gray-600 mb-1">{srv.description}</p>
                          <p className="text-teal-700 font-bold text-sm">{srv.price} Lei / bucată</p>
                        </div>
                        <div className="mt-1">
                          <div className={`w-6 h-6 border-2 rounded ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white'} flex items-center justify-center`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </div>
                      
                      {/* Contextual AC Counter */}
                      {isSelected && (
                        <div className="ml-14 mt-3 bg-white border border-gray-200 rounded-lg p-3 inline-block shadow-sm">
                           <label className="block text-xs font-bold text-gray-700 mb-2">Număr de Aparate AC ({srv.title})</label>
                           <div className="flex items-center">
                              <button onClick={(e) => { e.stopPropagation(); updateFormData('quantities', { ...formData.quantities, [srv.id]: Math.max(1, (formData.quantities[srv.id] || 1) - 1) }) }} className="w-10 h-10 bg-gray-50 border border-gray-300 rounded-l flex items-center justify-center font-bold text-gray-900 hover:bg-gray-100 transition">-</button>
                              <div className="w-14 h-10 border-y border-gray-300 bg-white flex items-center justify-center font-bold text-gray-900">{formData.quantities[srv.id] || 1}</div>
                              <button onClick={(e) => { e.stopPropagation(); updateFormData('quantities', { ...formData.quantities, [srv.id]: (formData.quantities[srv.id] || 1) + 1 }) }} className="w-10 h-10 bg-gray-50 border border-gray-300 rounded-r flex items-center justify-center font-bold text-gray-900 hover:bg-gray-100 transition">+</button>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {errors.selectedServices && <p className="text-xs text-red-600">{errors.selectedServices}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Observații (Opțional)</label>
                <textarea 
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" 
                  rows={3}
                  placeholder="Ex: Aparatul curge, scuipă gheață etc."
                  value={formData.observations}
                  onChange={(e) => updateFormData('observations', e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(1)} className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Înapoi</button>
                <button onClick={nextStep} className="w-2/3 bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-teal-500 transition">Continuă</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Contact */}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Date de Contact</h2>
              
              <div className="flex p-1 bg-gray-100 rounded-lg mb-6 border border-gray-200">
                <button onClick={() => updateFormData({ billingType: 'fizica', companyName: '', cui: '' })} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.billingType === 'fizica' ? 'bg-white shadow text-teal-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Persoană Fizică</button>
                <button onClick={() => updateFormData('billingType', 'juridica')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.billingType === 'juridica' ? 'bg-white shadow text-teal-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Persoană Juridică</button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="text" placeholder="Nume" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <input type="text" placeholder="Prenume" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="tel" placeholder="Telefon" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <input type="email" placeholder="Email" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {formData.billingType === 'juridica' && (
                  <div className="grid grid-cols-1 gap-4 p-4 border border-teal-200 bg-teal-50 rounded-lg">
                    <input type="text" placeholder="CUI Firma" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.cui || ''} onChange={(e) => updateFormData('cui', e.target.value)} />
                    <input type="text" placeholder="Nume Firma" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.companyName || ''} onChange={(e) => updateFormData('companyName', e.target.value)} />
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-sm text-gray-800 mt-4 mb-3">Adresa Intervenției</h4>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Strada" className="w-3/4 border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.street} onChange={(e) => updateFormData('street', e.target.value)} />
                    <input type="text" placeholder="Număr" className="w-1/4 border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.number} onChange={(e) => updateFormData('number', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <input type="text" placeholder="Bloc" className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.building} onChange={(e) => updateFormData('building', e.target.value)} />
                    <input type="text" placeholder="Ap." className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none placeholder-gray-400" value={formData.apartment} onChange={(e) => updateFormData('apartment', e.target.value)} />
                    <select className="col-span-2 w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none" value={formData.sector} onChange={(e) => updateFormData('sector', e.target.value)}>
                      <option value="">Alege Sector/Ilfov</option>
                      {['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Ilfov'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {errors.street && <p className="text-xs text-red-500 mt-1 text-center">{errors.street}</p>}
                  {errors.sector && <p className="text-xs text-red-500 mt-1 text-center">{errors.sector}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(2)} className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Înapoi</button>
                <button onClick={nextStep} className="w-2/3 bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-teal-500 transition">Continuă</button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Confirmare */}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sumar Programare</h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-sm text-gray-800">
                <p className="mb-2"><strong>Dată dorită:</strong> {formData.selectedDate && format(formData.selectedDate, 'dd MMM yyyy', { locale: ro })}</p>
                <div className="mb-2">
                    <strong>Servicii selectate:</strong>
                    <ul className="list-disc ml-5 mt-1 text-gray-700">
                      {services.filter(s => formData.selectedServices.includes(s.id)).map(srv => (
                        <li key={srv.id}>{formData.quantities[srv.id] || 1}x {srv.title} <span className="font-medium">({srv.price * (formData.quantities[srv.id] || 1)} Lei)</span></li>
                      ))}
                    </ul>
                </div>
                
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <p className="text-base"><strong>Total de plată estimat:</strong> <span className="font-bold text-teal-700 text-xl ml-2">
                    {services.filter(s => formData.selectedServices.includes(s.id)).reduce((sum, s) => sum + (s.price * (formData.quantities[s.id] || 1)), 0)} Lei
                  </span></p>
                  <p className="text-xs text-gray-500 mt-1">* Plata se face numerar/card la fața locului după finalizarea lucrării.</p>
                </div>
              </div>

              <div className="mb-6 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.gdprAccepted} onChange={(e) => updateFormData('gdprAccepted', e.target.checked)} />
                  <span className="text-sm text-gray-700">Sunt de acord cu prelucrarea datelor mele personale (GDPR) în vederea onorării reparației/igienizării.</span>
                </label>
                {errors.gdprAccepted && <p className="text-xs text-red-500">{errors.gdprAccepted}</p>}

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer mb-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.createAccount} onChange={(e) => updateFormData('createAccount', e.target.checked)} />
                    <span className="text-sm font-bold text-gray-800">Doresc crearea unui cont de client pentru a urmări comanda</span>
                  </label>
                  
                  {formData.createAccount && (
                    <div className="pl-7 mt-2">
                       <input 
                         type="password" 
                         placeholder="Alege o parolă (minim 6 caractere)" 
                         className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" 
                         value={formData.password} 
                         onChange={(e) => updateFormData('password', e.target.value)} 
                       />
                       {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(3)} className="w-1/4 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition" disabled={submitting}>Înapoi</button>
                <button onClick={handleSubmit} disabled={submitting} className="w-3/4 bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-teal-500 transition flex items-center justify-center">
                  {submitting ? 'Se trimite...' : 'Confirmă Programarea'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
