'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FloatingWhatsApp } from 'react-floating-whatsapp';
import { usePostHog } from 'posthog-js/react';

export default function WhatsAppWidget() {
    const pathname = usePathname();
    const [currentUrl, setCurrentUrl] = useState('');
    const posthog = usePostHog();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, [pathname]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>, formValue: string) => {
        event.preventDefault();

        // Track the opening of WhatsApp
        posthog?.capture('whatsapp_chat_opened', {
            page_url: currentUrl
        });

        // Construct the custom message
        const customMessage = `${formValue}\n\n---\nMesaj trimis de pe pagina: ${currentUrl}`;

        // Open WhatsApp
        window.open(`https://wa.me/40741819607?text=${encodeURIComponent(customMessage)}`, '_blank');
    };

    return (
        <div className="whatsapp-widget-wrapper">
            <FloatingWhatsApp
                phoneNumber="+40741819607"
                accountName="ClimaticPRO"
                avatar="/images/logo.png"
                statusMessage="Răspundem de obicei în câteva minute"
                chatMessage="Bună! 👋 Cu ce te putem ajuta astăzi?"
                placeholder="Scrie mesajul tău aici..."
                allowEsc
                notification
                notificationSound
                onSubmit={handleSubmit}
            />
        </div>
    );
}
