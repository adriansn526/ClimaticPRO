'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, addDays, isSameDay, isWeekend, isBefore, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';

interface DayBooking {
  date: Date;
  bookingsCount: number;
  maxBookings: number;
  isAvailable: boolean;
}

export default function InstallationCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [maxBookingsPerDay] = useState(3); // Configurabil: câte rezervări pe zi
  const [loading, setLoading] = useState(false);

  // Generare zile pentru calendar (30 zile în viitor)
  useEffect(() => {
    const generateBookings = async () => {
      setLoading(true);
      const days: DayBooking[] = [];
      const today = startOfDay(new Date());

      for (let i = 1; i <= 30; i++) {
        const date = addDays(today, i);
        
        // Simulare: fetch bookings din Google Calendar API
        // În producție: const count = await getBookingsCount(date);
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
  }, [maxBookingsPerDay]);

  const handleDateSelect = (day: DayBooking) => {
    if (day.isAvailable) {
      setSelectedDate(day.date);
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

  return (
    <section id="calendar" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Programează Instalarea
            </h2>
            <p className="text-lg text-gray-600">
              Selectează data dorită. Instalăm în 1-3 zile de la programare.
            </p>
          </div>

          {/* Calendar Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
          >
            {/* Legendă */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6 pb-6 border-b">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-600" />
                <span className="text-sm text-gray-600">Disponibil</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-50 border-2 border-orange-600" />
                <span className="text-sm text-gray-600">Ultimul loc</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-50 border-2 border-red-400" />
                <span className="text-sm text-gray-600">Complet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-400" />
                <span className="text-sm text-gray-600">Weekend</span>
              </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-gray-600">Se încarcă disponibilitatea...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {bookings.map((day, index) => {
                  const status = getDayStatus(day);
                  const isSelected = selectedDate && isSameDay(day.date, selectedDate);

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      disabled={!day.isAvailable}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${status.color}
                        ${isSelected ? 'border-primary-600 ring-2 ring-primary-200' : 'border-transparent'}
                        ${day.isAvailable ? 'hover:scale-105' : ''}
                      `}
                    >
                      {/* Zi */}
                      <div className="text-xs font-medium mb-1">
                        {format(day.date, 'EEE', { locale: ro })}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {format(day.date, 'd')}
                      </div>
                      <div className="text-xs">
                        {format(day.date, 'MMM', { locale: ro })}
                      </div>

                      {/* Indicator locuri */}
                      {day.isAvailable && (
                        <div className="mt-2 text-xs">
                          {day.maxBookings - day.bookingsCount} {day.maxBookings - day.bookingsCount === 1 ? 'loc' : 'locuri'}
                        </div>
                      )}

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Date Info */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Data selectată: {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Instalarea se va efectua între orele 09:00 - 17:00
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Informații importante:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Instalarea durează aproximativ 2-3 ore</li>
                    <li>• Echipa va suna cu 30 min înainte de sosire</li>
                    <li>• Weekend-urile sunt închise pentru instalări</li>
                    <li>• Poți reprograma cu minim 24h înainte</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            {selectedDate && (
              <div className="mt-6 text-center">
                <a
                  href="#formular"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                >
                  Continuă cu Programarea
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
