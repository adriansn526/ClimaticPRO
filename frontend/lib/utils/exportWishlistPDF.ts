import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WishlistItem } from '@/lib/hooks/useWishlist';

interface ExportOptions {
    companyName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
}

export function exportWishlistToPDF(
    wishlist: WishlistItem[],
    options: ExportOptions = {}
) {
    const {
        companyName = 'ClimaticPro',
        contactEmail = 'contact@climaticpro.ro',
        contactPhone = '+40 700 000 000', // Update with real phone if known
        notes = '',
    } = options;

    // Create PDF document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Use Times font which has better UTF-8 support
    doc.setFont('times', 'normal');
    // doc.setLanguage('ro-RO'); // Check if supported in current jspdf version or remove if errors

    // Helper to clean price
    const cleanPrice = (price: string | undefined): string => {
        if (!price) return '0 lei';
        return price
            .replace(/&nbsp;/g, ' ')
            .replace(/\s*RON\s*$/i, '')
            .replace(/\s*EUR\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Helper to get numeric price
    const getPriceValue = (price: string | undefined): number => {
        if (!price) return 0;
        const cleaned = price.replace(/&nbsp;/g, ' ');
        const match = cleaned.match(/[\d.,]+/);
        return match ? parseFloat(match[0].replace(',', '.')) : 0;
    };

    // Calculate total
    const total = wishlist.reduce((sum, item) => {
        return sum + getPriceValue(item.price);
    }, 0);

    // Header - Logo and Company Info
    doc.setFillColor(13, 148, 136); // Teal-600 (approx for ClimaticPro primary)
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text(companyName, 20, 20);

    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('Soluții Complete de Climatizare', 20, 28);

    // Contact info (right side)
    doc.setFontSize(9);
    doc.text(contactPhone, pageWidth - 20, 20, { align: 'right' });
    doc.text(contactEmail, pageWidth - 20, 26, { align: 'right' });
    doc.text('www.climaticpro.ro', pageWidth - 20, 32, { align: 'right' });

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('Lista de Favorite', 20, 55);

    // Date
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.text(`Data: ${currentDate}`, 20, 62);
    doc.text(`Număr produse: ${wishlist.length}`, 20, 68);

    // Table data
    const tableData = wishlist.map((item, index) => [
        (index + 1).toString(),
        item.name,
        cleanPrice(item.price),
    ]);

    // Add table
    autoTable(doc, {
        startY: 75,
        head: [['Nr.', 'Produs', 'Preț']],
        body: tableData,
        foot: [['', 'TOTAL', `${total.toFixed(2)} lei`]],
        theme: 'striped',
        headStyles: {
            fillColor: [13, 148, 136], // Teal
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
            font: 'times',
        },
        footStyles: {
            fillColor: [243, 244, 246],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 11,
            font: 'times',
        },
        styles: {
            fontSize: 10,
            cellPadding: 5,
            font: 'times',
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 40, halign: 'right' },
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251],
        },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Notes section (if provided)
    if (notes) {
        doc.setFontSize(11);
        doc.setFont('times', 'bold');
        doc.text('Notițe:', 20, finalY + 15);

        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        doc.setTextColor(60, 60, 60);
        const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
        doc.text(splitNotes, 20, finalY + 22);
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY, pageWidth - 20, footerY);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
        'Pentru comenzi sau întrebări, vă rugăm să ne contactați:',
        20,
        footerY + 7
    );
    doc.text(`${contactPhone} | ${contactEmail}`, 20, footerY + 13);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
        `Generat automat de ${companyName} - ${currentDate}`,
        pageWidth / 2,
        footerY + 20,
        { align: 'center' }
    );

    // Save PDF
    const fileName = `wishlist-climaticpro-${new Date().getTime()}.pdf`;
    doc.save(fileName);

    return fileName;
}
