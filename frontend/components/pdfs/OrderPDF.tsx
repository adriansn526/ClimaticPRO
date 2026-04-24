import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

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

interface OrderPDFProps {
    data: BookingData;
    orderId: string;
}

const orderStyles = StyleSheet.create({
    headerTitle: {
        color: '#0891b2', // Cyan-600
        fontSize: 22,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#0891b2',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    }
});

const OrderPDF = ({ data, orderId }: OrderPDFProps) => {
    const quantity = data.quantity || 1;
    const installPrice = 1000;
    const productPrice = data.selectedProduct?.price || 0;
    const fullPrice = data.selectedProduct?.priceWithInstallation || (productPrice + installPrice);

    const unitPrice = data.hasOwnDevice ? installPrice : fullPrice;
    const total = unitPrice * quantity;

    const address = `${data.street} ${data.number ? 'Nr. ' + data.number : ''}, ${data.sector}`;
    const dateFormatted = data.selectedDate ? new Date(data.selectedDate).toLocaleDateString('ro-RO') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: '#eee' }]}>
                    <View>
                        <Text style={orderStyles.headerTitle}>ClimaticPRO</Text>
                        <Text style={{ fontSize: 10, marginTop: 4, color: '#666' }}>Instalare Profesională Aer Condiționat</Text>
                        <Text style={{ fontSize: 10, marginTop: 2, color: '#666' }}>Tel: +40 316 060 050 | contact@climaticpro.ro</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0891b2' }}>Confirmare Programare #{orderId}</Text>
                        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: 'bold' }}>Emisă la: {new Date().toLocaleDateString('ro-RO')}</Text>
                    </View>
                </View>

                {/* Client Details Section */}
                <View style={styles.section}>
                    <Text style={orderStyles.sectionTitle}>Detalii Client & Locație</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.value}>Nume: {data.firstName} {data.lastName}</Text>
                            <Text style={styles.value}>Telefon: {data.phone}</Text>
                            <Text style={styles.value}>Email: {data.email}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.value}>Adresă: {address}</Text>
                            {dateFormatted && <Text style={styles.value}>Data Programată: {dateFormatted}</Text>}
                        </View>
                    </View>
                </View>

                {/* Order Items Table */}
                <View style={[styles.table, { borderColor: '#0891b2', borderWidth: 1 }]}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeaderFunc, { backgroundColor: '#0891b2' }]}>
                        <View style={[styles.tableCol, { width: '55%', borderColor: '#0891b2' }]}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#fff' }]}>Produs / Serviciu</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%', borderColor: '#0891b2' }]}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#fff' }]}>Cant.</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%', borderColor: '#0891b2' }]}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#fff' }]}>Preț Unitar</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '20%', borderColor: '#0891b2' }]}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#fff' }]}>Total</Text>
                        </View>
                    </View>

                    {/* Row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableCol, { width: '55%', borderColor: '#0891b2' }]}>
                            <Text style={styles.tableCell}>
                                {data.hasOwnDevice ? 'Servicii Instalare Standard (Echipament Client)' : (data.selectedProduct?.name || 'Pachet Aer Condiționat + Instalare')}
                            </Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%', borderColor: '#0891b2' }]}>
                            <Text style={styles.tableCell}>{quantity}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%', borderColor: '#0891b2' }]}>
                            <Text style={styles.tableCell}>{unitPrice.toLocaleString('ro-RO')} Lei</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '20%', borderColor: '#0891b2' }]}>
                            <Text style={styles.tableCell}>{total.toLocaleString('ro-RO')} Lei</Text>
                        </View>
                    </View>
                </View>

                {/* Total Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 0 }}>
                    <View style={{ width: 220, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                        <View style={[styles.row, { marginBottom: 0 }]}>
                            <Text style={{ fontWeight: 'bold' }}>Total Estimativ:</Text>
                            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{total.toLocaleString('ro-RO')} Lei</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.footer, { textAlign: 'left', borderTop: 'none', color: '#666' }]}>
                    <Text>Această confirmare reprezintă detaliile programării și nu este un document fiscal.</Text>
                    <Text style={{ marginTop: 2 }}>Plata va fi efectuată la fața locului, moment în care echipa de instalare va emite factura și garanția.</Text>
                    <Text style={{ marginTop: 2, fontWeight: 'bold', color: '#0891b2' }}>Garanție Montaj: 3 Ani de la data instalării.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default OrderPDF;
