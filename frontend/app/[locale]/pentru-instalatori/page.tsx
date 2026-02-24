import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { CheckCircle, Zap, ShieldCheck, Wallet, ArrowRight, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Pentru Instalatori - Devino Partener | ClimaticPro',
    description: 'Alătură-te rețelei de parteneri ClimaticPro. Lucrări garantate, plăți rapide și discount-uri exclusive la echipamente.',
};

export default function InstallerLandingPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white overflow-hidden pb-16 pt-24 lg:pt-32">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="inline-block py-1 px-3 rounded-full bg-primary-600/20 border border-primary-500 text-primary-300 text-sm font-bold mb-6">
                            Program Parteneriat 2024
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Câștigă mai mult ca <br className="hidden md:block" /> <span className="text-primary-500">Partener Instalator</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Transformă-ți afacerea. Îți oferim flux constant de lucrări, prețuri preferențiale la echipamente și plăți garantate.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="/cont/inregistrare?type=installer"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg hover:shadow-primary-600/30"
                            >
                                <UserPlus className="mr-2" size={20} />
                                Creează Cont Parcener
                            </Link>
                            <Link
                                href="#beneficii"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white border border-white/20 hover:bg-white/10 transition-colors"
                            >
                                Vezi Beneficiile
                            </Link>
                        </div>
                        <div className="mt-12 flex justify-center space-x-8 text-sm text-gray-400">
                            <div className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2" /> 0 Costuri de Înscriere</div>
                            <div className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2" /> Plăți Săptămânale</div>
                        </div>
                    </div>
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section id="beneficii" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">De ce să devii partener?</h2>
                        <p className="text-gray-600">Nu suntem doar un magazin, construim o rețea de profesioniști.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                                title: 'Lucrări Validate',
                                desc: 'Nu mai pierzi timp cu oferte refuzate. Primești comenzi ferme de montaj direct din platforma noastră.',
                                color: 'bg-yellow-50'
                            },
                            {
                                icon: <Wallet className="w-8 h-8 text-green-500" />,
                                title: 'Discount B2B',
                                desc: 'Accesezi prețuri speciale de distribuitor pentru echipamentele Daikin, Mitsubishi, Gree și altele.',
                                color: 'bg-green-50'
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
                                title: 'Plăți Garantate',
                                desc: 'Siguranță financiară. Facturezi către noi și primești banii rapid după confirmarea montajului.',
                                color: 'bg-blue-50'
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-10 md:p-14 flex flex-col justify-center">
                                <h3 className="text-3xl font-bold text-gray-900 mb-8">Cum funcționează?</h3>
                                <div className="space-y-8">
                                    {[
                                        { step: 1, title: 'Înscriere', text: 'Completezi formularul cu datele firmei și autorizațiile.' },
                                        { step: 2, title: 'Validare', text: 'Echipa noastră verifică documentele în max. 24h.' },
                                        { step: 3, title: 'Start', text: 'Primești acces în Dashboard și începi să preiei lucrări.' }
                                    ].map((s, i) => (
                                        <div key={i} className="flex">
                                            <div className="flex-shrink-0 mr-4">
                                                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                                                    {s.step}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{s.title}</h4>
                                                <p className="text-gray-600 text-sm">{s.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-100 min-h-[300px] relative">
                                {/* Placeholder for Dashboard Screenshot */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center p-6">
                                        <div className="w-full h-48 bg-white shadow-lg rounded-xl mb-4 mx-auto max-w-xs flex items-center justify-center text-gray-300">
                                            Screenshot Dashboard
                                        </div>
                                        <span className="text-gray-500 text-sm font-medium">Panou de Control Intuitiv</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="bg-primary-900 py-20 text-center text-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Gata să crești afacerea ta?</h2>
                    <p className="text-primary-100 mb-10 max-w-2xl mx-auto text-lg">
                        Nu ai nimic de pierdut. Înscrierea este gratuită și poți renunța oricând.
                    </p>
                    <Link
                        href="/cont/inregistrare?type=installer"
                        className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-xl text-primary-900 bg-white hover:bg-gray-100 transition-colors shadow-2xl"
                    >
                        Vreau să devin Partener
                        <ArrowRight className="ml-2" size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
