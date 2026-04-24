import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

import path from 'path';

// Register Romanian Diacritics friendly Font (Roboto) from local files
const fontPathRegular = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
const fontPathMedium = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Medium.ttf');

Font.register({
    family: 'Roboto',
    fonts: [
        { src: fontPathRegular, fontWeight: 'normal' },
        { src: fontPathMedium, fontWeight: 'bold' }
    ]
});

interface InstallerData {
    companyName: string;
    cui?: string;
    regCom?: string;
    address?: string;
    iban?: string;
    bank?: string;
}

interface ClientData {
    title?: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    jobId: string;
    date: string;
    products: any[];
    extraCosts: any[];
    baseLaborPrice: number;
    invoiceTotal: number;
    hasWebsiteBaseAmount: boolean;
}

interface ServiceDocumentProps {
    type: 'pv' | 'garantie' | 'factura';
    installerData: InstallerData;
    clientData: ClientData;
    serials: { internal: string; external: string };
    signatureUrl?: string;
}

const styles = StyleSheet.create({
    page: { 
        padding: 30, // Reduced from 40
        fontFamily: 'Roboto', 
        fontSize: 10, 
        color: '#1f2937',
        lineHeight: 1.4
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        borderBottomWidth: 2, 
        borderBottomColor: '#2563eb', 
        paddingBottom: 15, // Reduced from 20
        marginBottom: 15, // Reduced from 25
        alignItems: 'center'
    },
    logo: {
        width: 140,
        height: 45,
        objectFit: 'contain'
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 9,
        color: '#4b5563'
    },
    companyTitle: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#1e3a8a',
        marginBottom: 2
    },
    docContainer: {
        backgroundColor: '#f8fafc',
        padding: 12, // Reduced from 15
        borderRadius: 4,
        marginBottom: 15, // Reduced from 20
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    docTitle: { 
        fontSize: 16, // Reduced from 18
        fontWeight: 'bold', 
        color: '#1e3a8a',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    docSubtitle: {
        fontSize: 10,
        color: '#64748b'
    },
    docMetaTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    sectionTitle: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: '#ffffff',
        backgroundColor: '#2563eb', 
        paddingVertical: 4, // Reduced from 6
        paddingHorizontal: 10, 
        marginBottom: 8, // Reduced from 12
        marginTop: 10, // Reduced from 20
        borderRadius: 2
    },
    row: { 
        flexDirection: 'row', 
        marginBottom: 8 
    },
    label: { 
        width: 130, 
        fontWeight: 'bold',
        color: '#475569'
    },
    value: { 
        flex: 1,
        color: '#0f172a'
    },
    paragraph: {
        textAlign: 'justify',
        marginBottom: 8,
        color: '#334155'
    },
    footer: { 
        position: 'absolute', 
        bottom: 30, 
        left: 40, 
        right: 40, 
        textAlign: 'center', 
        color: '#94a3b8', 
        fontSize: 8, 
        borderTopWidth: 1, 
        borderTopColor: '#e2e8f0', 
        paddingTop: 10 
    },
    signaturesContainer: {
        flexDirection: 'row', 
        marginTop: 20, // Reduced from 50
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    signatureBlock: {
        width: 200,
        alignItems: 'center'
    },
    signatureTitle: {
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        color: '#1e293b'
    },
    signatureName: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 10
    },
    signatureBox: { 
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed', 
        height: 80, 
        width: 180, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 4
    },
    signatureImg: { 
        objectFit: 'contain', 
        width: '90%', 
        height: '90%' 
    },
    table: { 
        borderWidth: 1, 
        borderColor: '#e2e8f0', 
        marginTop: 20,
        borderRadius: 4,
        overflow: 'hidden'
    },
    tableRow: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e2e8f0' 
    },
    tableHeaderRow: { 
        backgroundColor: '#f1f5f9', 
        fontWeight: 'bold' 
    },
    tableCol1: { width: '10%', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 8, textAlign: 'center' },
    tableCol2: { width: '50%', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 8 },
    tableCol3: { width: '15%', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 8, textAlign: 'center' },
    tableCol4: { width: '25%', padding: 8, textAlign: 'right' },
    listBullet: {
        marginLeft: 10,
        marginBottom: 4
    }
});

const Header = ({ installer }: { installer: InstallerData }) => (
    <View style={styles.header}>
        <Image src="https://climaticpro.ro/images/logo.png" style={styles.logo} />
        <View style={styles.companyInfo}>
            <Text style={styles.companyTitle}>{installer.companyName}</Text>
            {installer.cui && <Text>CUI: {installer.cui}</Text>}
            {installer.regCom && <Text>Reg. Com: {installer.regCom}</Text>}
            {installer.address && <Text>{installer.address}</Text>}
            {installer.iban && <Text>IBAN: {installer.iban}</Text>}
            {installer.bank && <Text>Bancă: {installer.bank}</Text>}
        </View>
    </View>
);

const DocumentMeta = ({ client, title, subtitle }: { client: ClientData, title: string, subtitle?: string }) => (
    <View style={styles.docContainer}>
        <View>
            <Text style={styles.docTitle}>{title}</Text>
            {subtitle && <Text style={styles.docSubtitle}>{subtitle}</Text>}
        </View>
        <View style={{ textAlign: 'right' }}>
            <Text style={styles.docMetaTitle}>Referinţă Lucrare: #{client.jobId}</Text>
            <Text>Data emiterii: {client.date}</Text>
        </View>
    </View>
);

const normalizeText = (text: string) => {
    if (!text) return text;
    return text.replace(/ș/g, 'ş').replace(/ț/g, 'ţ').replace(/Ș/g, 'Ş').replace(/Ț/g, 'Ţ');
};

const ProcesVerbal = ({ installer, client, serials, signatureUrl }: any) => {
    const isIgienizare = (client.title || '').toLowerCase().includes('igienizare') || (client.title || '').toLowerCase().includes('mentenan');
    
    return (
        <Page size="A4" style={styles.page}>
            <Header installer={installer} />
            <DocumentMeta 
                client={{...client, name: normalizeText(client.name)}} 
                title="Proces Verbal" 
                subtitle={isIgienizare ? "Pentru Igienizare și Mentenanță" : "de Predare-Primire şi Punere în Funcţiune"} 
            />

            <View style={styles.paragraph}>
                <Text>{normalizeText(`Subscrisa ${installer.companyName}, în calitate de EXECUTANT, declarăm că am predat, iar eu, ${client.name}, în calitate de BENEFICIAR, am recepționat lucrările de ${isIgienizare ? 'igienizare și mentenanță' : 'instalare'} conform detaliilor tehnice descrise mai jos:`)}</Text>
            </View>

            <Text style={styles.sectionTitle}>{isIgienizare ? "1. Operațiuni Executate" : "1. Echipamente Instalate"}</Text>
            {isIgienizare ? (
                <>
                    <Text style={styles.listBullet}>• Curățarea și dezinfectarea vaporizatorului și a filtrelor.</Text>
                    <Text style={styles.listBullet}>• Verificarea stării de funcționare a echipamentului (presiuni / temperatură reci).</Text>
                    <Text style={styles.listBullet}>• Verificarea conductei de condens.</Text>
                    <Text style={styles.listBullet}>• Aplicarea soluțiilor igienizante antibacteriene.</Text>
                    {client.products.map((p: any, i: number) => <Text key={`prd-${i}`} style={styles.listBullet}>• Echipament servit: {normalizeText(typeof p === 'string' ? p : p.name)}</Text>)}
                </>
            ) : (
                client.products.length > 0 ? (
                    client.products.map((p: any, i: number) => <Text key={i} style={styles.listBullet}>• {normalizeText(typeof p === 'string' ? p : p.name)}</Text>)
                ) : <Text style={styles.listBullet}>• Echipament standard aer condiţionat.</Text>
            )}

            {client.extraCosts && client.extraCosts.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>1.1. Materiale şi Servicii Suplimentare</Text>
                    {client.extraCosts.map((extra: any, i: number) => (
                        <Text key={i} style={styles.listBullet}>• {normalizeText(extra.description)} (Cantitate: {extra.quantity} {extra.description?.toLowerCase()?.includes('traseu') ? 'ML' : 'buc'})</Text>
                    ))}
                </>
            )}

            <Text style={styles.sectionTitle}>{isIgienizare ? "2. Date Sistem Existente" : "2. Date Identificare Sistem"}</Text>
            <View style={styles.row}><Text style={styles.label}>Serie Unitate Internă:</Text><Text style={styles.value}>{serials.internal || 'Nesanată'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Serie Unitate Externă:</Text><Text style={styles.value}>{serials.external || 'Nesanată'}</Text></View>
            
            <Text style={styles.sectionTitle}>{isIgienizare ? "3. Declarații și Limitarea Răspunderii" : "3. Declaraţii şi Concluzii"}</Text>
            {isIgienizare ? (
                <>
                    <Text style={styles.listBullet}>{normalizeText('• Echipa tehnică a constatat că aparatul funcționa, scopul intervenției fiind strict curățarea / igienizarea.')}</Text>
                    <Text style={styles.listBullet}>{normalizeText('• Prezenta intervenție nu atrage garanția asupra eventualelor defecțiuni tehnologice viitoare, vicii ascunse, scurgeri de freon preexistente sau defecțiuni hardware. Acestea reprezintă reparații / diagnosticari tarifate separat.')}</Text>
                </>
            ) : (
                <>
                    <Text style={styles.listBullet}>{normalizeText('• Echipamentul a fost instalat respectând procedurile tehnice (inclusiv vidare traseu și probă de condens).')}</Text>
                    <Text style={styles.listBullet}>{normalizeText('• Beneficiarul certifică conformitatea traseelor frigorifice la recepție. Echipamentul a fost testat și funcționează la standarde.')}</Text>
                    <Text style={styles.listBullet}>{normalizeText('• Nu ne asumăm răspunderea pentru performanța instalațiilor, conductelor sau cablajelor îngropate, pre-instalate de asociații, constructori sau terți.')}</Text>
                    <Text style={styles.listBullet}>{normalizeText('• Sursa de electricitate stabilă cu împământare trebuie asigurată imperativ de către client/beneficiar.')}</Text>
                </>
            )}

            <View style={styles.signaturesContainer}>
            <View style={styles.signatureBlock}>
                <Text style={styles.signatureTitle}>Instalator (Executant)</Text>
                <Text style={styles.signatureName}>{normalizeText(installer.companyName)}</Text>
                <View style={styles.signatureBox}><Text style={{ color: '#94a3b8' }}>Semnat / Ştampilat digital</Text></View>
            </View>
            <View style={styles.signatureBlock}>
                <Text style={styles.signatureTitle}>Client (Beneficiar)</Text>
                <Text style={styles.signatureName}>{normalizeText(client.name)}</Text>
                <View style={styles.signatureBox}>
                    {signatureUrl ? <Image src={signatureUrl} style={styles.signatureImg} /> : <Text style={{ color: '#94a3b8' }}>Fără semnătură digitală</Text>}
                </View>
            </View>
        </View>

        <Text style={styles.footer}>Generat automat de platforma ClimaticPRO • Prezentul document are validitate juridică conform acordului la distanţă.</Text>
    </Page>
    );
};

const Garantie = ({ installer, client, serials }: any) => (
    <Page size="A4" style={[styles.page, { fontSize: 9 }]}>
        <Header installer={installer} />
        <DocumentMeta client={{...client, name: normalizeText(client.name)}} title="Certificat de Garanţie" subtitle="Pentru manopera de instalare" />
        
        <View style={styles.paragraph}>
            <Text>{normalizeText(`Prin prezentul certificat de garanție se atestă calitatea lucrărilor de instalare executate de ${installer.companyName} la adresa ${client.address}.`)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Detalii Lucrare Asigurată</Text>
        <View style={styles.row}><Text style={styles.label}>Beneficiar:</Text><Text style={styles.value}>{normalizeText(client.name)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Echipament(e):</Text><Text style={styles.value}>{normalizeText(client.products.map((p:any) => typeof p === 'string' ? p : p.name).join(', '))}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Serii Echipament:</Text><Text style={styles.value}>U.I: {serials.internal || '-'} / U.E: {serials.external || '-'}</Text></View>

        <Text style={styles.sectionTitle}>Termeni şi Condiţii Garanţie</Text>
        <Text style={styles.paragraph}>{normalizeText(`1. Perioada de garanție pentru manoperă (montaj) este de 2 Ani, pornind de la data punerii în funcțiune (${client.date}).`)}</Text>
        <Text style={styles.paragraph}>{normalizeText('2. Prezenta garanție acoperă strict defectele apărute din cauza instalării necorespunzătoare (cum ar fi scurgeri de freon pe la îmbinările de bercluire sau scurgeri ale apei de condens în interior din cauza înclinației greșite).')}</Text>
        <Text style={styles.paragraph}>{normalizeText('3. Garanția de montaj NU acoperă defecțiunile echipamentelor (compresor, placă de bază, senzori). Acestea sunt asigurate exclusiv de producătorul aparatului, pe baza facturii de achiziție.')}</Text>
        <Text style={styles.paragraph}>{normalizeText('4. Orice desigilare, mutare sau intervenție neautorizată asupra traseului frigorific de către terți sau depanatori atrage după sine anularea imediată a garanției de montaj.')}</Text>

        <View style={[styles.signaturesContainer, { marginTop: 30 }]}>
            <View style={styles.signatureBlock}>
                <Text style={styles.signatureTitle}>Garant (Companie Instalatoare)</Text>
                <Text style={styles.signatureName}>{normalizeText(installer.companyName)}</Text>
                <View style={[styles.signatureBox, { borderColor: '#2563eb' }]}><Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Validat Digital</Text></View>
            </View>
        </View>

        <Text style={[styles.footer, { bottom: 20 }]}>Generat automat de platforma ClimaticPRO.</Text>
    </Page>
);

const Factura = ({ installer, client }: any) => (
    <Page size="A4" style={styles.page}>
        <Header installer={installer} />
        
        <View style={[styles.docContainer, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <View>
                <Text style={styles.docTitle}>Factură Fiscală</Text>
                <Text style={styles.docMetaTitle}>Seria/Număr: PRO-{client.jobId}</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
                <Text>Data emiterii: {client.date}</Text>
                <Text>Cota TVA: - (Neplătitor TVA / Regim special)</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Client / Cumpărător</Text>
        <View style={styles.row}><Text style={styles.label}>Nume / Companie:</Text><Text style={styles.value}>{normalizeText(client.name)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Adresă facturare:</Text><Text style={styles.value}>{normalizeText(client.address)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Telefon contact:</Text><Text style={styles.value}>{client.phone}</Text></View>

        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={styles.tableCol1}>Nr.</Text>
                <Text style={styles.tableCol2}>Denumire produs / Serviciu prestat</Text>
                <Text style={styles.tableCol3}>Cant</Text>
                <Text style={styles.tableCol4}>Valoare</Text>
            </View>

            {client.products.map((prod: any, idx: number) => {
                const prodPrice = Number(prod.price || prod.price_b2b || 0);
                const prodQty = Number(prod.quantity || 1);
                // Daca comanda a venit de pe site, o consideram cu pret 0 in tabel (a fost incasata la global in baseLaborPrice) 
                // dar afisam doar daca este produs din App
                const displayPrice = client.hasWebsiteBaseAmount ? 'Inclus' : (prodPrice > 0 ? `${prodPrice * prodQty} RON` : 'Inclus');
                const displayName = normalizeText(typeof prod === 'string' ? prod : prod.name);
                return (
                    <View style={styles.tableRow} key={`prod-${idx}`}>
                        <Text style={styles.tableCol1}>{idx + 1}</Text>
                        <Text style={styles.tableCol2}>{displayName}</Text>
                        <Text style={styles.tableCol3}>{prodQty} buc</Text>
                        <Text style={styles.tableCol4}>{displayPrice}</Text>
                    </View>
                );
            })}
            
            <View style={styles.tableRow}>
                <Text style={styles.tableCol1}>{client.products.length + 1}</Text>
                <Text style={styles.tableCol2}>Prestări servicii instalare ({client.hasWebsiteBaseAmount ? 'Valoare Integrală Comandă' : 'Manoperă'})</Text>
                <Text style={styles.tableCol3}>1 buc</Text>
                <Text style={styles.tableCol4}>{client.baseLaborPrice > 0 ? `${client.baseLaborPrice} RON` : 'Total Convenit'}</Text>
            </View>

            {client.extraCosts && client.extraCosts.map((extra: any, idx: number) => {
                const qty = parseFloat(String(extra.quantity).replace(',', '.')) || 0;
                const amt = parseFloat(extra.amount) || 0;
                return (
                    <View style={styles.tableRow} key={`ext-${idx}`}>
                        <Text style={styles.tableCol1}>{client.products.length + 2 + idx}</Text>
                        <Text style={styles.tableCol2}>{normalizeText(extra.description)}</Text>
                        <Text style={styles.tableCol3}>{qty} {extra.description?.toLowerCase()?.includes('traseu') ? 'ML' : 'Buc'}</Text>
                        <Text style={styles.tableCol4}>{qty * amt} RON</Text>
                    </View>
                );
            })}
        </View>
        <Text style={{ marginTop: 25, fontStyle: 'italic', fontSize: 9, color: '#64748b' }}>* Această factură este valabilă fără semnătură şi ştampilă conform Codului Fiscal, Legea nr. 227/2015, art. 319, alin. 29.</Text>
        
        <View style={{ position: 'absolute', bottom: 60, right: 40, width: 220, padding: 10, borderTopWidth: 2, borderTopColor: '#1e3a8a' }}>
            <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12 }}>TOTAL DE PLATĂ</Text>
            <Text style={{ textAlign: 'right', fontSize: 15, color: '#1e3a8a', fontWeight: 'bold' }}>{client.invoiceTotal > 0 ? `${client.invoiceTotal} RON` : 'Conform Deviz'}</Text>
        </View>

        <Text style={styles.footer}>Generat automat via platforma centralizată ClimaticPRO.</Text>
    </Page>
);

export default function DocumentTemplate({ type, installerData, clientData, serials, signatureUrl }: ServiceDocumentProps) {
    return (
        <Document>
            {type === 'pv' && <ProcesVerbal installer={installerData} client={clientData} serials={serials} signatureUrl={signatureUrl} />}
            {type === 'garantie' && <Garantie installer={installerData} client={clientData} serials={serials} />}
            {type === 'factura' && <Factura installer={installerData} client={clientData} />}
        </Document>
    );
}
