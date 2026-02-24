import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Building2, Briefcase, FileCheck, Truck, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Vânzări B2B și Instituții Publice | ClimaticPro',
    description: 'Soluții climatizare pentru companii, dezvoltatori imobiliari și instituții publice prin SEAP/SICAP.',
};

export default function B2BSalesPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Hero */}
            <div className="relative bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-b2b.jpg')] bg-cover bg-center"></div>
                <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center text-center">
                    <span className="bg-blue-600/30 text-blue-300 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-blue-500/50">
                        Business & Corporate
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        Soluții Profesionale de Climatizare <br /> pentru Afacerea Ta
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl mb-10">
                        Partenerul de încredere pentru dezvoltatori imobiliari, companii HoReCa și instituții publice.
                        Oferim consultanță, echipamente premium și suport dedicat.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button href="/contact" variant="primary" size="lg">
                            Solicită Ofertă Personalizată
                        </Button>
                        <Button href="#seap" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                            Detalii SEAP/SICAP
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 space-y-20">

                {/* SEAP / SICAP Section */}
                <section id="seap" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-10 lg:p-14 flex flex-col justify-center">
                            <div className="flex items-center space-x-3 mb-6">
                                <Building2 className="text-blue-600" size={32} />
                                <h2 className="text-3xl font-bold text-gray-900">Instituții Publice (SEAP)</h2>
                            </div>
                            <p className="text-gray-600 mb-6 text-lg">
                                Suntem prezenți pe platforma națională de achiziții publice <strong>SEAP/SICAP</strong>.
                                Facilităm achiziția de echipamente de climatizare pentru școli, spitale, primării și alte instituții ale statului.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Consultanță în întocmirea caietului de sarcini',
                                    'Gamă variată de produse (Split, Multisplit, VRF)',
                                    'Facturare conformă cu cerințele bugetare',
                                    'Livrare rapidă și transport gratuit'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-gray-700 font-medium">
                                        <FileCheck className="text-green-500 mr-3 flex-shrink-0" size={20} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                <strong>Cum ne găsiți?</strong> Căutați <strong>SC CLIMATICPRO SRL</strong> (sau denumirea legală) în catalogul electronic SEAP.
                            </div>
                        </div>
                        <div className="bg-gray-100 relative min-h-[300px] lg:min-h-full">
                            {/* Placeholder for SEAP relevant image */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-xl">
                                Image: Office Building / Public Institution
                            </div>
                        </div>
                    </div>
                </section>

                {/* B2B Segments Grid */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Cui ne adresăm?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Oferim soluții adaptate pentru diverse sectoare de activitate.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Briefcase size={32} />,
                                title: 'Office & Corporate',
                                desc: 'Climatizare eficientă pentru spații de birouri. Sisteme VRF, casete de tavan și soluții de purificare a aerului.'
                            },
                            {
                                icon: <Building2 size={32} />,
                                title: 'Dezvoltatori Imobiliari',
                                desc: 'Pachete complete pentru ansambluri rezidențiale. Prețuri preferențiale la volume mari și livrare etapizată.'
                            },
                            {
                                icon: <Users size={32} />,
                                title: 'HoReCa & Retail',
                                desc: 'Soluții robuste pentru hoteluri, restaurante și spații comerciale. Confort termic pentru clienții tăi.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Installer Marketplace Promo */}
                <section className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-10 md:p-16 text-white relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-primary-400 font-bold tracking-wider uppercase text-sm mb-2 block">Parteneriat</span>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ești instalator sau revânzător?</h2>
                            <p className="text-gray-300 text-lg mb-8">
                                Alătură-te rețelei noastre de parteneri și beneficiază de prețuri speciale, acces la stocuri în timp real și lead-uri de montaj.
                            </p>
                            <Link href="/pentru-instalatori" className="inline-flex items-center bg-white text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                                Devino Partener
                                <ArrowRight className="ml-2" size={18} />
                            </Link>
                        </div>
                        <div className="hidden lg:block relative h-64">
                            {/* Abstract visual or dashboard preview */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center space-x-4 mb-4 border-b border-white/10 pb-4">
                                    <div className="w-10 h-10 bg-primary-500 rounded-full"></div>
                                    <div>
                                        <div className="h-2 w-24 bg-white/20 rounded mb-2"></div>
                                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-8 w-full bg-white/10 rounded"></div>
                                    <div className="h-8 w-full bg-white/10 rounded"></div>
                                    <div className="h-8 w-3/4 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
