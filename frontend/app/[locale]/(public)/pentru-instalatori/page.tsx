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
                            Program Parteneriat {new Date().getFullYear()}
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

            {/* Mobile App Section */}
            <section className="py-20 bg-primary-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2">
                            <span className="inline-block py-1 px-3 rounded-full bg-primary-600/10 text-primary-700 text-sm font-bold mb-4">
                                Nou – 100% Gratuită
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Aplicația Mobilă ClimaticPRO</h2>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Gestionează totul direct de pe telefonul tău, oriunde te-ai afla. Am construit o aplicație nativă special concepută pentru partenerii noștri instalatori.
                            </p>

                            <ul className="space-y-4 mb-10">
                                {[
                                    'Preluare instantă cu notificări a noilor lucrări disponibile',
                                    'Rapoarte și istoric detaliat pentru venituri și statusuri',
                                    'Comenzi directe de echipamente B2B la preț redus',
                                    'Măsoară direct, generează procese verbale și ia semnătura pe ecran',
                                    'Gestionare stocuri de materiale direct din mașină'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700 text-lg">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <a
                                  href="/ClimaticPRO.apk"
                                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-600/30"
                                >
                                  <Zap className="w-6 h-6 mr-3" />
                                  Descarcă (1.1.23 APK)
                                </a>
                                
                                <a
                                  href="/downloads/ClimaticPRO-Dev.apk"
                                  download
                                  className="inline-flex items-center justify-center px-6 py-4 text-base font-semibold rounded-xl text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200 transition-colors"
                                >
                                  Client Dezvoltator (Expo)
                                </a>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                                * Momentan disponibilă doar pentru instalare directă pe dispozitivele Android. Clinetul Dezvoltator este pentru programare.
                            </p>
                        </div>
                        <div className="md:w-1/2 w-full flex justify-center">
                            <div className="relative">
                                {/* Mock Phone frame */}
                                <div className="w-[300px] h-[600px] bg-slate-900 border-8 border-gray-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-4">
                                    <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-2xl w-40 mx-auto z-20"></div>
                                    <div className="w-full h-full bg-gray-100 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden relative">
                                        {/* A simple placeholder suggesting the app UI */}
                                        <div className="absolute top-0 w-full h-16 bg-blue-600 flex items-center px-4">
                                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                                            <div className="ml-3 h-4 w-24 bg-white/30 rounded"></div>
                                        </div>
                                        <div className="mt-16 w-full px-4 space-y-4">
                                            <div className="w-full h-24 bg-white rounded-xl shadow-sm"></div>
                                            <div className="w-full h-24 bg-white rounded-xl shadow-sm"></div>
                                            <div className="w-full h-24 bg-white rounded-xl shadow-sm"></div>
                                        </div>
                                        <div className="absolute bottom-0 w-full h-16 bg-white border-t flex justify-around items-center">
                                            <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                            <div className="w-6 h-6 bg-blue-500 rounded"></div>
                                            <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                            <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>
                                <div className="absolute top-20 -left-10 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -z-10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="bg-slate-900 py-20 text-center text-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Gata să crești afacerea ta?</h2>
                    <p className="text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
                        Nu ai nimic de pierdut. Înscrierea este gratuită și poți renunța oricând.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link
                            href="/cont/inregistrare?type=installer"
                            className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-xl text-slate-900 bg-white hover:bg-gray-100 transition-colors shadow-2xl w-full sm:w-auto"
                        >
                            Vreau să devin Partener
                            <ArrowRight className="ml-2" size={20} />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-xl text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors shadow-lg w-full sm:w-auto hover:border-slate-500"
                        >
                            Contactează-ne
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
