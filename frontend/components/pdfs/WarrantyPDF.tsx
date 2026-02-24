import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

interface WarrantyProps {
    jobId: string;
    client: {
        name: string;
        address: string;
    };
    installer: {
        companyName: string;
        cui: string;
        warrantyInfo?: string;
    };
    products: Array<{
        name: string;
        sn_ui: string;
        sn_ue: string;
        warranty: string;
    }>;
    date: string;
}

// Robust implementation of simple HTML parser for React-PDF
const HtmlText = ({ text }: { text: string }) => {
    if (!text) return null;

    // Replace <br> with newlines for Text component
    // Note: React-PDF Text component handles \n as new line.
    // Handling bold/italic requires nested <Text> components.

    // 1. Sanitize and prep
    let cleanText = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<p>/gi, '');

    // 2. Split by bold tags
    const fragments = cleanText.split(/(<b>.*?<\/b>|<strong>.*?<\/strong>)/g);

    return (
        <Text style={{ fontSize: 9, color: '#555', marginBottom: 5 }}>
            {fragments.map((frag, i) => {
                if (frag.startsWith('<b>') || frag.startsWith('<strong>')) {
                    const content = frag.replace(/<\/?b>|<\/?strong>/g, '');
                    return <Text key={i} style={{ fontWeight: 'bold' }}>{content}</Text>;
                }
                return <Text key={i}>{frag}</Text>;
            })}
        </Text>
    );
};

const WarrantyPDF = ({ jobId, client, installer, products, date }: WarrantyProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* ... Header ... */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Certificat de Garanție</Text>
                    <Text style={{ fontSize: 10, color: '#7f8c8d', marginTop: 5 }}>Nr. #{jobId}</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 10 }}>Data: {date}</Text>
                </View>
            </View>

            {/* Info Section */}
            <View style={[styles.row, styles.section]}>
                <View style={styles.col}>
                    <Text style={styles.label}>Prestator (Instalator)</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{installer.companyName}</Text>
                    <Text style={styles.value}>CUI: {installer.cui}</Text>
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Beneficiar</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{client.name}</Text>
                    <Text style={styles.value}>{client.address}</Text>
                </View>
            </View>

            {/* Products Table */}
            <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderFunc]}>
                    <View style={[styles.tableCol, { width: '40%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Produs</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '25%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>SN Unitate Internă</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '25%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>SN Unitate Externă</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '10%' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Garanție</Text>
                    </View>
                </View>

                {/* Table Rows */}
                {products.map((product, index) => (
                    <View style={styles.tableRow} key={index}>
                        <View style={[styles.tableCol, { width: '40%' }]}>
                            <Text style={styles.tableCell}>{product.name}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '25%' }]}>
                            <Text style={styles.tableCell}>{product.sn_ui || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '25%' }]}>
                            <Text style={styles.tableCell}>{product.sn_ue || '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                            <Text style={styles.tableCell}>{product.warranty}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Terms */}
            <View style={styles.section}>
                <Text style={{ fontSize: 9, color: '#555', marginBottom: 5 }}>
                    1. Prezentul certificat atestă funcționarea corectă a echipamentului la momentul instalării (pornire, verificări parametri).
                </Text>
                <Text style={{ fontSize: 9, color: '#555', marginBottom: 5 }}>
                    2. Garanția acoperă exclusiv instalarea și eventualele defecte de montaj (pierderi freon, scurgeri condens cauzate de montaj) pe perioada specificată.
                </Text>
                <Text style={{ fontSize: 9, color: '#555', marginBottom: 10 }}>
                    3. Echipamentul beneficiază de garanție separată de la producător/importator, conform certificatului original care însoțește aparatul.
                </Text>

                {/* Custom Installer Terms */}
                {installer.warrantyInfo && (
                    <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 4, border: 1, borderColor: '#eee' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Condiții Suplimentare Instalator:</Text>
                        <HtmlText text={installer.warrantyInfo} />
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Generat automat prin platforma ClimaticPRO - Soluții Profesionale HVAC</Text>
            </View>
        </Page>
    </Document>
);

export default WarrantyPDF;
