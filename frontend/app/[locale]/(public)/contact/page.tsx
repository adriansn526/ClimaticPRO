import React from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
    title: 'Contact | ClimaticPro',
    description: 'Contactează echipa ClimaticPro pentru asistență, oferte personalizate sau programări service aer condiționat.',
};

export default function ContactPage() {
    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'Contact', href: '/contact' }
    ];

    const contactMethods = [
        {
            icon: <Phone className="w-6 h-6 text-primary-600" />,
            title: 'Telefon',
            details: ['+40 316 060 050'],
            action: { label: 'Sună acum', href: 'tel:+40316060050' }
        },
        {
            icon: <Mail className="w-6 h-6 text-primary-600" />,
            title: 'Email',
            details: ['contact@climaticpro.ro'],
            action: { label: 'Trimite email', href: 'mailto:contact@climaticpro.ro' }
        },
        {
            icon: <MapPin className="w-6 h-6 text-primary-600" />,
            title: 'Adresă',
            details: ['București, Ilfov și împrejurimi', 'Acoperire echipaje mobile'],
            action: null
        },
        {
            icon: <Clock className="w-6 h-6 text-primary-600" />,
            title: 'Program',
            details: ['Luni - Vineri: 08:00 - 18:00', 'Sâmbătă - Duminică: Închis'],
            action: null
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Breadcrumbs */}
            <div className="bg-white border-b mb-8">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
            </div>

            {/* Header */}
            <section className="container mx-auto px-4 mb-12">
                <div className="max-w-3xl text-center mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contactează-ne</h1>
                    <p className="text-lg text-gray-600">
                        Ai o întrebare sau dorești o ofertă personalizată? Suntem aici să te ajutăm. Alege metoda preferată de contact de mai jos.
                    </p>
                </div>
            </section>

            {/* Methods Grid */}
            <section className="container mx-auto px-4 mb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {contactMethods.map((method, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                                {method.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
                            <div className="flex-grow space-y-1 mb-4">
                                {method.details.map((detail, idx) => (
                                    <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                                ))}
                            </div>
                            {method.action && (
                                <a
                                    href={method.action.href}
                                    className="text-primary-600 font-medium hover:text-primary-700 text-sm transition-colors"
                                >
                                    {method.action.label}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Contact Section */}
            <section className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Form Side */}
                        <div className="p-8 md:p-12 lg:p-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trimite-ne un mesaj</h2>
                            <p className="text-gray-600 mb-8">Completați formularul de mai jos și un membru al echipei vă va contacta în cel mai scurt timp posibil.</p>
                            <ContactForm />
                        </div>

                        {/* Info/Map Side */}
                        <div className="bg-gray-100 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden">
                            {/* Decorative Map Pattern or Simple Gradient for now to avoid messy iframe without real API Key */}
                            <div className="relative z-10 w-full h-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d182281.33405763077!2d25.96492314352636!3d44.43792691563214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1f93abf3cad4f%3A0xac0632e37c9ca628!2sBucure%C8%99ti!5e0!3m2!1sro!2sro!4v1700000000000!5m2!1sro!2sro"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
