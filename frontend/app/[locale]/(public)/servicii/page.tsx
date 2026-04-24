import React from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PenTool, Wind, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Servicii Climatizare | ClimaticPro',
    description: 'Servicii complete de instalare, mentenanță, curățare și reparații aparate aer condiționat. Află cum te putem ajuta.',
};

export default function ServicesPage() {
    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'Servicii', href: '/servicii' }
    ];

    const services = [
        {
            title: 'Instalare Aer Condiționat',
            description: 'Montaj standard sau complex pentru orice marcă, realizat de echipe profesioniste care lasă curățenie la final.',
            icon: <PenTool className="w-8 h-8 text-primary-600" />,
            link: '/instalare',
            linkText: 'Programează o Instalare'
        },
        {
            title: 'Mentenanță și Igienizare',
            description: 'Curățare profesională a unităților interne și externe, completare freon și verificare parametri de funcționare optimă.',
            icon: <Wind className="w-8 h-8 text-cyan-600" />,
            link: '/contact',
            linkText: 'Solicită Mentenanță'
        },
        {
            title: 'Consultanță Alegere Echipament',
            description: 'Nu ești sigur ce aparat ți se potrivește? Te ajutăm să alegi capacitatea corectă (BTU) și funcțiile necesare locuinței tale.',
            icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
            link: '/produse',
            linkText: 'Vezi Produse'
        },
        {
            title: 'Reparații și Intervenții',
            description: 'Echipa noastră tehnică poate diagnostica și remedia rapid orice defecțiune apărută la sistemul tău de climatizare.',
            icon: <Wrench className="w-8 h-8 text-orange-600" />,
            link: '/contact',
            linkText: 'Cere Ajutor'
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Breadcrumbs Banner */}
            <div className="bg-white border-b mb-8">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
            </div>

            {/* Hero Section */}
            <section className="container mx-auto px-4 mb-16">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        Serviciile Noastre
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Oferim soluții complete pentru aerul tău condiționat: de la vânzare și instalare profesională, până la curățare și întreținere pe termen lung.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="container mx-auto px-4 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {services.map((service, index) => (
                        <div key={index} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                                {service.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                            <p className="text-gray-600 flex-grow mb-6 leading-relaxed">
                                {service.description}
                            </p>
                            <Link
                                href={service.link}
                                className="inline-flex items-center font-medium text-primary-600 hover:text-primary-800 transition-colors group"
                            >
                                {service.linkText}
                                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="container mx-auto px-4 mb-16">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-14 text-center text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Ai nevoie de un serviciu specializat?</h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Suntem aici să te ajutăm. Contactează-ne acum pentru o ofertă personalizată sau pentru a programa o intervenție.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/contact" className="px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto">
                                Contactează-ne
                            </Link>
                            <Link href="/instalare" className="px-8 py-3 border border-gray-600 text-white font-medium rounded-lg hover:border-white transition-colors w-full sm:w-auto">
                                Programează Instalare
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
