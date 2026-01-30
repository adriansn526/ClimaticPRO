'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function StickyInstallationCTA() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show button after scrolling past the hero section (approx 600px)
            const shouldShow = window.scrollY > 600;
            setIsVisible(shouldShow);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToWizard = () => {
        const element = document.getElementById('booking-wizard');
        if (element) {
            // Offset for sticky header
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 right-4 z-40 sm:bottom-8 sm:right-8"
                >
                    <button
                        onClick={scrollToWizard}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all"
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="hidden sm:inline">Rezervă Instalarea</span>
                        <span className="sm:hidden">Rezervă</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
