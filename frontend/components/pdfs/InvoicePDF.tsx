import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

interface InvoiceItem {
    name: string;
    um: string;
    qty: number;
    price: number;
    total: number;
}

interface InvoiceProps {
    series: string;
    number: string;
    date: string;
    provider: {
        name: string;
        cui: string;
        address: string;
        bank: string;
        iban: string;
    };
    client: {
        name: string;
        address: string;
    };
    items: InvoiceItem[];
    total: number;
}

// Override style for header color
const invoiceStyles = StyleSheet.create({
    headerTitle: {
        color: '#27ae60', // Emerald Green
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

const InvoicePDF = ({ series, number, date, provider, client, items, total }: InvoiceProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: '#27ae60' }]}>
                <View>
                    <Text style={invoiceStyles.headerTitle}>Factură</Text>
                    <Text style={{ fontSize: 9, marginTop: 4, backgroundColor: '#eee', padding: 2, borderRadius: 2, alignSelf: 'flex-start' }}>FĂRĂ TVA</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{series} - {number}</Text>
                    <Text style={{ fontSize: 10 }}>Data: {date}</Text>
                </View>
            </View>

            {/* Info Section */}
            <View style={[styles.row, styles.section]}>
                <View style={styles.col}>
                    <Text style={[styles.label, { color: '#27ae60' }]}>Furnizor</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{provider.name}</Text>
                    <Text style={styles.value}>CUI: {provider.cui}</Text>
                    <Text style={styles.value}>{provider.address}</Text>
                    <Text style={[styles.value, { marginTop: 5 }]}>Banca: {provider.bank}</Text>
                    <Text style={styles.value}>IBAN: {provider.iban}</Text>
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Cumpărător</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{client.name}</Text>
                    <Text style={styles.value}>{client.address}</Text>
                </View>
            </View>

            {/* Invoice Items Table */}
            <View style={[styles.table, { borderColor: '#e8f5e9' }]}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeaderFunc, { backgroundColor: '#e8f5e9' }]}>
                    <View style={[styles.tableCol, { width: '5%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>#</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '45%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Denumire Produs / Serviciu</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '10%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>UM</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '10%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Cant.</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '15%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Preț Unit.</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '15%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Valoare</Text>
                    </View>
                </View>

                {/* Rows */}
                {items.map((item, index) => (
                    <View style={styles.tableRow} key={index}>
                        <View style={[styles.tableCol, { width: '5%' }]}>
                            <Text style={styles.tableCell}>{index + 1}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '45%' }]}>
                            <Text style={styles.tableCell}>{item.name}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                            <Text style={styles.tableCell}>{item.um}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                            <Text style={styles.tableCell}>{item.qty}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%' }]}>
                            <Text style={styles.tableCell}>{item.price.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '15%' }]}>
                            <Text style={styles.tableCell}>{item.total.toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Total Section */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <View style={{ width: 200, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 4 }}>
                    <View style={[styles.row, { marginBottom: 5 }]}>
                        <Text style={{ fontWeight: 'bold' }}>Total de plată:</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#27ae60' }}>{total.toFixed(2)} RON</Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Factura este valabilă fără semnatura și ștampilă conform art. 319 alin. 29 din Legea 227/2015.</Text>
            </View>
        </Page>
    </Document>
);

export default InvoicePDF;
