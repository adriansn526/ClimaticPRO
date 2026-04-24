import React from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Politica de Confidențialitate & GDPR | ClimaticPro',
    description: 'Află cum colectăm, folosim și protejăm datele tale personale conform standardelor GDPR.',
};

export default function GDPRPage() {
    const breadcrumbs = [
        { label: 'Acasă', href: '/' },
        { label: 'GDPR & Cookies', href: '/gdpr' }
    ];

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Breadcrumbs Banner */}
            <div className="bg-white border-b mb-8">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
            </div>

            <section className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 lg:p-16">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Politica de Confidențialitate și Protecția Datelor (GDPR)</h1>

                    <div className="prose prose-primary max-w-none text-gray-600">
                        <p className="lead">
                            Această pagină explică modul în care <strong>ClimaticPro</strong> colectează, utilizează, protejează și procesează datele dumneavoastră cu caracter personal, în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).
                        </p>

                        <h3>1. Ce date colectăm?</h3>
                        <p>
                            În cursul utilizării website-ului nostru sau a serviciilor de instalare, putem colecta și procesa următoarele categorii de date:
                        </p>
                        <ul>
                            <li><strong>Date de identificare și contact:</strong> nume, prenume, adresa de e-mail, numărul de telefon, adresa.</li>
                            <li><strong>Date privind comenzile și instalările:</strong> istoricul cumpărăturilor, preferințele pentru servicii, detalii tehnice comunicate de dumneavoastră.</li>
                            <li><strong>Date tehnice și de trafic:</strong> adresa IP, tipul de browser, dispozitivul utilizat pentru a accesa site-ul, paginile vizitate (prin intermediul cookie-urilor funcționale și analitice).</li>
                        </ul>

                        <h3>2. Scopul colectării datelor</h3>
                        <p>
                            Prelucrăm datele dumneavoastră în următoarele scopuri legitime:
                        </p>
                        <ul>
                            <li>Pentru a procesa, confirma și onora programările pentru serviciile de instalare sau mentenanță aer condiționat.</li>
                            <li>Pentru a oferi suport tehnic și răspunsuri la solicitările trimise prin intermediul paginii de contact.</li>
                            <li>Pentru facturare și gestionarea documentelor contabile necesare din punct de vedere legal.</li>
                            <li>Pentru a îmbunătăți funcționarea website-ului nostru prin analize statistice anonimizate.</li>
                        </ul>

                        <h3>3. Cât timp păstrăm datele?</h3>
                        <p>
                            Datele personale sunt păstrate doar atât timp cât este necesar pentru scopurile descrise în această politică sau atât timp cât ne obligă legislația fiscală și comercială (de exemplu, facturile fiscale conținând datele sunt păstrate pentru o perioadă minimă obligatorie prevăzută de lege).
                        </p>

                        <h3>4. Drepturile dumneavoastră (GDPR)</h3>
                        <p>
                            În conformitate cu legislația europeană privind protecția datelor, aveți următoarele drepturi:
                        </p>
                        <ul>
                            <li><strong>Dreptul de acces:</strong> puteți solicita informații despre datele personale pe care le deținem despre dumneavoastră.</li>
                            <li><strong>Dreptul la rectificare:</strong> aveți dreptul de a ne cere să corectăm orice informații incorecte sau incomplete.</li>
                            <li><strong>Dreptul la ștergere („dreptul de a fi uitat”):</strong> puteți cere ștergerea datelor dacă acestea nu mai sunt necesare scopurilor pentru care au fost colectate (cu excepția constrângerilor legale).</li>
                            <li><strong>Dreptul la restricționarea prelucrării.</strong></li>
                            <li><strong>Dreptul la opoziție și la retragerea consimțământului.</strong></li>
                        </ul>

                        <h3>5. Cookie-uri</h3>
                        <p>
                            Acest website folosește cookie-uri (cum ar fi instrumente de tracking pentru performanță - PostHog, Google Analytics) pentru a asigura o experiență de navigare personalizată și fluidă. Prin continuarea navigării pe site, vă exprimați acordul asupra utilizării cookie-urilor de bază.
                        </p>

                        <h3>6. Cum ne puteți contacta?</h3>
                        <div className="bg-gray-50 p-6 rounded-lg mt-6 border border-gray-100">
                            <p className="mb-2"><strong>Dacă doriți să vă exercitați oricare dintre aceste drepturi sau aveți întrebări suplimentare, ne puteți contacta la:</strong></p>
                            <ul className="list-none pl-0">
                                <li><strong>Email:</strong> <a href="mailto:contact@climaticpro.ro" className="text-primary-600 font-medium">contact@climaticpro.ro</a></li>
                                <li><strong>Telefon:</strong> <a href="tel:+40316060050" className="text-primary-600 font-medium">+40 316 060 050</a></li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-500">
                                Vom prelua și procesa gratuit orice cerere primită în termenul legal.
                            </p>
                        </div>

                        <div className="mt-12 text-sm text-gray-400 border-t pt-4">
                            Ultima actualizare: Septembrie 2024
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
