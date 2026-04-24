import React from 'react';
import { pdf } from '@react-pdf/renderer';
import OrderPDF from '@/components/pdfs/OrderPDF';

interface BookingData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    street: string;
    number: string;
    sector: string;
    selectedDate: string | Date | null;
    selectedProduct: any;
    quantity: number;
    hasOwnDevice: boolean;
}

export const generateOrderPDF = async (data: BookingData, orderId: string) => {
    try {
        const doc = React.createElement(OrderPDF, { data, orderId });
        const asPdf = pdf(doc as any);
        const blob = await asPdf.toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Comanda_ClimaticPRO_${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Eroare la generarea PDF-ului:', error);
    }
};
