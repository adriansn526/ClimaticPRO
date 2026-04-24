'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Wrench, Droplets, Hammer } from 'lucide-react'; // Added icons
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface ServicesSectionProps {
  instalarePrice?: string;
  igienizarePrice?: string;
  reparatiePrice?: string;
}

export default function ServicesSection({ instalarePrice, igienizarePrice, reparatiePrice }: ServicesSectionProps) {
  const t = useTranslations('services');

  const services = [
    {
      key: 'installation',
      title: 'Instalare Aer Condiționat',
      description: 'Montaj profesional cu echipe autorizate. Garanție pe lucrare.',
      price: instalarePrice || 'De la 950 RON',
      features: ['Echipe autorizate', 'Materiale incluse', 'Garanție montaj', 'Programare rapidă'],
      icon: Hammer,
      cta: 'Vezi Oferta',
      link: '/instalare',
      popular: true,
    },
    {
      key: 'cleaning',
      title: 'Igienizare Profesională',
      description: 'Curățare profundă pentru un aer sănătos și eficiență maximă.',
      price: igienizarePrice || 'De la 150 RON',
      features: ['Curățare filtre', 'Dezinfectare vaporizator', 'Verificare freon', 'Eliminare mirosuri'],
      icon: Droplets,
      cta: 'Programează',
      link: '/mentenanta',
      popular: false,
    },
    {
      key: 'repair',
      title: 'Reparații & Mentenanță',
      description: 'Remedierea situațiilor în care curge apă din aparat sau alte defecțiuni.',
      price: reparatiePrice || 'De la 150 RON',
      features: ['Diagnosticare rapidă', 'Deblocare scurgere', 'Verificare etanșeitate', 'Reparații diverse'],
      icon: Wrench,
      cta: 'Programează',
      link: '/mentenanta',
      popular: false,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-900"
          >
            Servicii Profesionale
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Oferim servicii complete de montaj, întreținere și reparații pentru sistemul tău de climatizare.
          </motion.p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex"
            >
              <Card
                hover
                className={`flex-1 border border-gray-200 flex flex-col overflow-hidden ${service.popular ? 'ring-2 ring-primary-600 shadow-xl relative scale-105 z-10' : 'shadow-lg'}`}
              >
                {/* Header Section */}
                <div className={`p-6 text-center border-b border-gray-100 ${service.popular ? 'bg-primary-50' : 'bg-white'}`}>
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${service.popular ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 min-h-[56px] flex items-center justify-center">
                    {service.title}
                  </h3>

                  {/* Price */}
                  <div className="my-4 min-h-[48px] flex items-center justify-center">
                    <span className={`font-bold text-gray-900 tracking-tight ${service.price.includes('Lei') ? 'text-3xl' : 'text-2xl'}`}>
                      {service.price}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm min-h-[40px]">
                    {service.description}
                  </p>
                </div>

                <div className="p-6 flex flex-col flex-grow bg-white">
                  {/* Features List */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className={`p-0.5 rounded-full mr-2 flex-shrink-0 mt-0.5 ${service.popular ? 'bg-primary-100' : 'bg-green-100'}`}>
                          <Check className={`w-3 h-3 ${service.popular ? 'text-primary-700' : 'text-green-700'}`} />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={service.link} className="block mt-auto">
                    <Button
                      variant={service.popular ? 'primary' : 'outline'}
                      className={`w-full py-2.5 font-bold ${service.popular
                        ? '!bg-[#0052a3] !text-white hover:!bg-[#003d7a] shadow-lg hover:shadow-xl border-none ring-0'
                        : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      {service.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
