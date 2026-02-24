import React from 'react';
import { useTranslations } from 'next-intl';

export default function ServicePage() {
    const t = useTranslations('common');
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-6">Servicii ClimaticPRO</h1>
            <p>Pagina în construcție.</p>
        </div>
    );
}
