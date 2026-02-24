import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { CreditCard, Banknote, Building, ChevronsRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Metode de Plată | ClimaticPro',
    description: 'Află cum poți plăti produsele ClimaticPro: Card Online, Rate TBI Bank cu Dobândă 0%, Transfer Bancar sau Ramburs.',
};

export default function PaymentMethodsPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-blue-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Metode de Plată</h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                        Flexibilitate totală pentru confortul tău. Alege metoda care ți se potrivește cel mai bine.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 space-y-12">

                {/* TBI Bank - Highlight */}
                <section className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200" id="tbi">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="inline-flex items-center space-x-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-bold w-fit mb-6">
                                <span>Recomandat</span>
                                <CheckCircle size={14} />
                            </div>
                            <div className="mb-6 relative h-12 w-32">
                                {/* Placeholder for TBI Logo, using text for now or generic image if available */}
                                <span className="text-3xl font-black text-[#FF0080]">tbi</span><span className="text-3xl font-black text-gray-800">bank</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Cumpără acum, plătește mai târziu. <br />
                                <span className="text-[#FF0080]">Rate cu 0% Dobândă.</span>
                            </h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                Pentru cumpărături de până la 2.000 RON, beneficiezi de 4 rate egale fără dobândă.
                                Proces 100% online, direct din coșul de cumpărături.
                            </p>

                            <ul className="space-y-3 mb-8">
                                {['Doar cu buletinul', 'Răspuns rapid (cca. 10 min)', 'Fără drumuri la bancă', 'Disponibil 24/7'].map((item, i) => (
                                    <li key={i} className="flex items-center text-gray-700">
                                        <ChevronsRight className="text-[#FF0080] mr-2" size={20} />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-2">Exemplu de calcul:</h4>
                                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                                    <span>Valoare produs:</span>
                                    <span className="font-bold">1.800 RON</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-200 pb-2 mb-2">
                                    <span>Dobândă (0%):</span>
                                    <span className="font-bold">0 RON</span>
                                </div>
                                <div className="flex justify-between items-center text-lg text-primary-600 font-bold">
                                    <span>Rata lunară (x4):</span>
                                    <span>450 RON</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#FF0080] to-pink-700 p-8 md:p-12 flex items-center justify-center text-white">
                            <div className="text-center">
                                <div className="relative w-full max-w-sm mx-auto aspect-square bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm p-4">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold mb-2">Cum aplici?</h3>
                                        <ol className="text-left space-y-4 max-w-xs mx-auto text-pink-50 text-sm mt-4">
                                            <li className="flex">
                                                <span className="bg-white text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</span>
                                                Adaugă produsele în coș.
                                            </li>
                                            <li className="flex">
                                                <span className="bg-white text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</span>
                                                Selectează "TBI Pay" la finalizare.
                                            </li>
                                            <li className="flex">
                                                <span className="bg-white text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</span>
                                                Completezi datele și semnezi electronic.
                                            </li>
                                            <li className="flex">
                                                <span className="bg-white text-pink-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</span>
                                                Comanda este aprobată și expediată.
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Other Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Card Online */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                            <CreditCard size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Card Online</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Plată securizată 100% prin procesatorul <strong>Netopia Payments</strong> sau <strong>Stripe</strong>.
                            Acceptăm Visa și Mastercard.
                        </p>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Visa</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Mastercard</span>
                        </div>
                    </div>

                    {/* Transfer Bancar (OP) */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-6">
                            <Building size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Ordin de Plată (OP)</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Ideal pentru persoanele juridice. Factura proforma se generează automat la plasarea comenzii.
                            Expedierea se face după confirmarea plății.
                        </p>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Recomandat B2B</span>
                    </div>

                    {/* Ramburs */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-6">
                            <Banknote size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Ramburs (Cash)</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Plătești curierului la livrarea produselor. Disponibil pentru comenzi de până la 5.000 RON (pentru persoane juridice) sau 10.000 RON (persoane fizice).
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}
