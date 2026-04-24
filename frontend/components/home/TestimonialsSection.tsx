'use client';

import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
    {
        id: 1,
        name: 'Andrei Popescu',
        role: 'Client Rezidențial',
        content: 'Servicii impecabile! Echipa a ajuns la timp, instalarea a durat mai puțin decât mă așteptam, iar curățenia de după a fost exemplară. Recomand cu încredere!',
        rating: 5,
        location: 'București'
    },
    {
        id: 2,
        name: 'Maria Ionescu',
        role: 'Client Business',
        content: 'Am colaborat pentru climatizarea birourilor noastre. Consultanța a fost profesionistă, ajutându-ne să alegem soluția optimă pentru spațiul nostru. Foarte mulțumiți de rezultat.',
        rating: 5,
        location: 'Ilfov'
    },
    {
        id: 3,
        name: 'George Dumitrescu',
        role: 'Client Rezidențial',
        content: 'Prețuri corecte și transparență totală. Mi-a plăcut că mi-au explicat diferențele dintre modele fără să încerce să-mi vândă cel mai scump produs. Aparatul funcționează perfect.',
        rating: 5,
        location: 'București'
    }
];

import { useState, useEffect } from 'react';

export default function TestimonialsSection() {
    const [reviews, setReviews] = useState(testimonials);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch reviews from our backend
        fetch('/api/public/reviews')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                }
            })
            .catch(err => console.error("Could not fetch google reviews", err))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <section className="py-20 bg-gray-50 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                        Ce spun clienții noștri
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Părerea ta contează pentru noi. Iată câteva dintre experiențele clienților care au ales ClimaticPro.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col"
                        >
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-primary-100" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>

                            <p className="text-gray-700 text-lg mb-6 italic relative z-10 flex-grow">
                                "{testimonial.content}"
                            </p>

                            <div className="flex items-center gap-4 border-t pt-6 mt-auto">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.location} • {testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
