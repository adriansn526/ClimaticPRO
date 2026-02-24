import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const generateOrderPDF = (data: BookingData, orderId: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(8, 145, 178); // Cyan-600
    doc.text('ClimaticPRO', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Instalare Profesională Aer Condiționat', 14, 26);
    doc.text('Tel: +40 316 300 101 | contact@climaticpro.ro', 14, 30);

    // Order Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Comandă #${orderId}`, 14, 45);

    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('ro-RO')}`, 14, 52);

    // Client Details
    doc.setFontSize(12);
    doc.setTextColor(8, 145, 178);
    doc.text('Detalii Client & Locație', 14, 65);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Nume: ${data.firstName} ${data.lastName}`, 14, 72);
    doc.text(`Telefon: ${data.phone}`, 14, 77);
    doc.text(`Email: ${data.email}`, 14, 82);

    const address = `${data.street} ${data.number ? 'Nr. ' + data.number : ''}, ${data.sector}`;
    doc.text(`Adresă: ${address}`, 14, 87);

    if (data.selectedDate) {
        doc.text(`Data Programată: ${new Date(data.selectedDate).toLocaleDateString('ro-RO')}`, 14, 95);
    }

    // Table Data
    const quantity = data.quantity || 1;
    const installPrice = 1000;
    const productPrice = data.selectedProduct?.price || 0;
    const fullPrice = data.selectedProduct?.priceWithInstallation || (productPrice + installPrice);

    const unitPrice = data.hasOwnDevice ? installPrice : fullPrice;
    const total = unitPrice * quantity;

    const tableBody = [
        [
            data.hasOwnDevice ? 'Servicii Instalare Standard (Echipament Client)' : (data.selectedProduct?.name || 'Pachet Aer Condiționat + Instalare'),
            `${quantity}`,
            `${unitPrice.toLocaleString()} Lei`,
            `${total.toLocaleString()} Lei`
        ]
    ];

    autoTable(doc, {
        startY: 105,
        head: [['Produs / Serviciu', 'Cant.', 'Preț Unitar', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178], textColor: 255 },
        foot: [['', '', 'Total de plată:', `${total.toLocaleString()} Lei`]],
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Această confirmare nu reprezintă o factură fiscală. Factura va fi emisă la finalizarea instalării.', 14, finalY + 10);
    doc.text('Garanție Montaj: 3 Ani de la data instalării.', 14, finalY + 15);

    // Save
    doc.save(`Comanda_ClimaticPRO_${orderId}.pdf`);
};
