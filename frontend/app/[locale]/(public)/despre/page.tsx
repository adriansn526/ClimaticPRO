import React from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Target, ShieldCheck, ThumbsUp, Medal } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Despre Noi | ClimaticPro',
    description: 'Află mai multe despre ClimaticPro, experiența noastră de peste 15 ani în aer condiționat și angajamentul pentru profesionalism.',
};

export default function AboutPage() {
    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'Despre Noi', href: '/despre' }
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
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        Bun venit pe <span className="text-primary-600">ClimaticPro.ro</span>!
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Suntem un grup dedicat de profesioniști specializați în instalația și întreținerea sistemelor de aer condiționat, cu o experiență impresionantă de peste 15 ani.
                    </p>
                </div>
            </section>

            {/* Main Content & Video */}
            <section className="container mx-auto px-4 mb-20">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

                        {/* Text Column */}
                        <div className="p-8 md:p-12 prose prose-lg prose-primary max-w-none text-gray-600 flex flex-col justify-center">
                            <p className="lead font-medium text-gray-900">
                                Credem în furnizarea unui serviciu de cea mai înaltă calitate, care să fie la fel de curat și eficient ca aerul condiționat pe care îl instalăm. Pasiunea și angajamentul nostru față de excelență ne-au condus pe un drum de succes continuu.
                            </p>
                            <p>
                                Suntem cunoscuți pentru profesionalismul nostru și pentru faptul că <strong className="text-primary-700">menținem curățenia în timpul procesului de instalare</strong>. Înțelegem că instalarea unui sistem poate implica multe schimbări, motiv pentru care ne angajăm să minimizăm orice disconfort.
                            </p>
                            <p>
                                Echipa noastră este formată din tehnicieni calificați, instruiți în mod regulat pentru a fi la curent cu cele mai recente tehnologii și practici. Ne mândrim cu abilitatea de a instala sisteme cu eficiență maximă, fără a lăsa mizerie în urmă.
                            </p>
                            <p className="italic text-gray-500 mt-4">
                                La noi, aerul condiționat nu este doar o afacere, este o pasiune.
                            </p>
                        </div>

                        {/* Video Column */}
                        <div className="relative w-full h-64 sm:h-80 lg:h-auto bg-gray-900 flex items-center justify-center">
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/HwP0e9pWbr4?start=2"
                                title="ClimaticPro Prezentare"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                    </div>
                </div>
            </section>

            {/* Vision & Badges */}
            <section className="container mx-auto px-4 mb-16">
                <div className="max-w-5xl mx-auto">

                    {/* Vision Banner */}
                    <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl mb-12 border-t-4 border-primary-500">
                        <Target className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-6 text-primary-400 opacity-90" />
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Viziunea Noastră</h2>
                        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-light leading-relaxed">
                            "Viziunea noastră este să continuăm să oferim servicii de aer condiționat de top, cu respect maxim pentru spațiul dumneavoastră și să ne consolidăm poziția ca lideri de încredere în industrie."
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 mx-auto bg-blue-50 text-primary-600 rounded-full flex items-center justify-center mb-6">
                                <Medal className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">15+ Ani Experiență</h3>
                            <p className="text-gray-600">Un istoric bogat și o reputație formidabilă consolidată prin mii de proiecte de succes.</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Montaj Curat</h3>
                            <p className="text-gray-600">Garantăm eficiență maximă la instalare, protejând în același timp integritatea și curățenia locuinței tale.</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 mx-auto bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Soluții Rapide</h3>
                            <p className="text-gray-600">Dacă ești în căutarea unei soluții ideale și rapide pentru confortul tău termic, suntem alegerea perfectă.</p>
                        </div>

                    </div>

                </div>
            </section>

        </main>
    );
}
