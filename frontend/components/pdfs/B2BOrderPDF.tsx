import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register font (same as InvoicePDF)
Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333'
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a365d' // Blue-900
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4
    },
    section: {
        marginBottom: 20
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: 100,
        fontWeight: 'bold',
        color: '#666'
    },
    value: {
        flex: 1
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8
    },
    col1: { width: '50%' },
    col2: { width: '15%', textAlign: 'center' },
    col3: { width: '15%', textAlign: 'right' },
    col4: { width: '20%', textAlign: 'right' },

    totalSection: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 8
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 10,
        fontWeight: 'bold'
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
        fontWeight: 'bold'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#999',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    }
});

interface B2BOrderPDFProps {
    orderId: string | number;
    date: string;
    supplier: {
        name: string;
        cui?: string;
        address?: string;
    };
    buyer: {
        companyName: string; // ClimaticPRO info
        cui: string;
        address: string;
        bank?: string;
        iban?: string;
    };
    items: {
        name: string;
        quantity: number;
        price: number; // Unit price
    }[];
}

const B2BOrderPDF: React.FC<B2BOrderPDFProps> = ({ orderId, date, supplier, buyer, items }) => {
    const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>COMANDĂ FURNIZOR</Text>
                        <Text style={styles.subtitle}>#{orderId} / {date}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#888' }}>ClimaticPRO</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
                    {/* Buyer (Us) */}
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#1a365d' }}>Cumpărător</Text>
                        <Text style={{ fontWeight: 'bold' }}>{buyer.companyName}</Text>
                        <Text>CUI: {buyer.cui}</Text>
                        <Text>{buyer.address}</Text>
                        {buyer.bank && <Text>Banca: {buyer.bank}</Text>}
                        {buyer.iban && <Text>IBAN: {buyer.iban}</Text>}
                    </View>

                    {/* Supplier */}
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#1a365d' }}>Furnizor</Text>
                        <Text style={{ fontWeight: 'bold' }}>{supplier.name}</Text>
                        <Text>CUI: {supplier.cui || '-'}</Text>
                        <Text>{supplier.address || '-'}</Text>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Produs / Serviciu</Text>
                        <Text style={styles.col2}>Cant.</Text>
                        <Text style={styles.col3}>Preț Unit.</Text>
                        <Text style={styles.col4}>Total</Text>
                    </View>
                    {items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{item.name}</Text>
                            <Text style={styles.col2}>{item.quantity}</Text>
                            <Text style={styles.col3}>{item.price.toFixed(2)}</Text>
                            <Text style={styles.col4}>{(item.quantity * item.price).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>TOTAL (RON):</Text>
                    <Text style={styles.totalValue}>{total.toFixed(2)}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Vă rugăm să confirmați primirea comenzii și termenul de livrare.</Text>
                    <Text>Document generat automat prin platforma ClimaticPRO.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default B2BOrderPDF;
