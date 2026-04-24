import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register font for Romanian Diacritics
Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#333'
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    titleBox: {
        marginBottom: 10
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a365d' // Dark Blue
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4
    },
    section: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    infoBox: {
        width: '45%',
        padding: 10,
        backgroundColor: '#fafafa',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#eee'
    },
    boxTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1a365d',
        textTransform: 'uppercase'
    },
    textLine: {
        marginBottom: 3,
        lineHeight: 1.4
    },
    bold: {
        fontWeight: 'bold'
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8,
        fontWeight: 'bold',
        color: '#1a365d'
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
        marginTop: 20,
        flexDirection: 'column',
        alignItems: 'flex-end',
        paddingRight: 8
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 15,
        color: '#666'
    },
    totalValue: {
        width: 80,
        textAlign: 'right'
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    grandTotalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 15,
        fontWeight: 'bold',
        fontSize: 12,
        color: '#1a365d'
    },
    grandTotalValue: {
        width: 80,
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: 12,
        color: '#1a365d'
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

interface B2BInvoicePDFProps {
    invoiceNumber: string;
    date: string;
    seller: {
        companyName: string;
        cui: string;
        regCom: string;
        address: string;
        bankName: string;
        iban: string;
        contactPhone: string;
    };
    buyer: {
        companyName: string;
        cui: string;
        regCom: string;
        address: string;
        bankName?: string;
        iban?: string;
    };
    items: {
        name: string;
        quantity: number;
        price: number; 
    }[];
    total: number;
    isProforma?: boolean;
}

const B2BInvoicePDF: React.FC<B2BInvoicePDFProps> = ({ invoiceNumber, date, seller, buyer, items, total, isProforma = false }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>{isProforma ? 'FACTURĂ PROFORMĂ' : 'FACTURĂ FISCALĂ'}</Text>
                        <Text style={styles.subtitle}>{isProforma ? 'Seria PRO / Nr:' : 'Seria CLI / Nr:'} {invoiceNumber}</Text>
                        <Text style={styles.subtitle}>Data: {date}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#888' }}>ClimaticPRO</Text>
                    </View>
                </View>

                {/* Seller & Buyer Info */}
                <View style={styles.section}>
                    <View style={styles.infoBox}>
                        <Text style={styles.boxTitle}>FURNIZOR (Vânzător)</Text>
                        <Text style={[styles.textLine, styles.bold]}>{seller.companyName || 'ClimaticPRO'}</Text>
                        <Text style={styles.textLine}>CUI: {seller.cui || '-'}</Text>
                        <Text style={styles.textLine}>Reg. Com: {seller.regCom || '-'}</Text>
                        <Text style={styles.textLine}>Adresă: {seller.address || '-'}</Text>
                        <Text style={styles.textLine}>Banca: {seller.bankName || '-'}</Text>
                        <Text style={styles.textLine}>IBAN: {seller.iban || '-'}</Text>
                        <Text style={styles.textLine}>Telefon: {seller.contactPhone || '-'}</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.boxTitle}>CLIENT (Cumpărător B2B)</Text>
                        <Text style={[styles.textLine, styles.bold]}>{buyer.companyName || 'Client Neidentificat'}</Text>
                        <Text style={styles.textLine}>CUI: {buyer.cui || '-'}</Text>
                        <Text style={styles.textLine}>Reg. Com: {buyer.regCom || '-'}</Text>
                        <Text style={styles.textLine}>Adresă: {buyer.address || 'Nespecificată'}</Text>
                        {buyer.bankName && <Text style={styles.textLine}>Banca: {buyer.bankName}</Text>}
                        {buyer.iban && <Text style={styles.textLine}>IBAN: {buyer.iban}</Text>}
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Denumire Produs / Serviciu</Text>
                        <Text style={styles.col2}>Cantitate</Text>
                        <Text style={styles.col3}>Preț Unit. (RON)</Text>
                        <Text style={styles.col4}>Valoare (RON)</Text>
                    </View>
                    
                    {items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.col1}>{item.name}</Text>
                            <Text style={styles.col2}>{item.quantity}</Text>
                            <Text style={styles.col3}>{Number(item.price).toFixed(2)}</Text>
                            <Text style={styles.col4}>{(item.quantity * item.price).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals Output */}
                <View style={styles.totalSection}>
                    <View style={styles.grandTotal}>
                        <Text style={styles.grandTotalLabel}>TOTAL DE PLATĂ:</Text>
                        <Text style={styles.grandTotalValue}>{Number(total).toFixed(2)} RON</Text>
                    </View>
                </View>

                {/* Footer Messages */}
                <View style={styles.footer}>
                    <Text>Această {isProforma ? 'factură proformă a fost generată' : 'factură fiscală a fost emisă'} automat prin platforma de comenzi B2B ClimaticPRO.</Text>
                    {isProforma && <Text>Vă rugăm să folosiți numărul proformei la detaliile transferului bancar.</Text>}
                </View>
            </Page>
        </Document>
    );
};

export default B2BInvoicePDF;
