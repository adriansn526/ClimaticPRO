import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobs } from '../../context/JobContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import SignatureScreen from 'react-native-signature-canvas';

interface ExtraCost {
    id: string;
    description: string;
    amount: string;
    quantity: string;
}

const PREDEFINED_EXTRAS = [
    { id: '1', description: 'Traseu frigorific suplimentar (>3m)', amount: 150 },
    { id: '2', description: 'Gaură suplimentară perete beton', amount: 100 },
    { id: '3', description: 'Utilizare Schelă / Scară înaltă', amount: 200 },
    { id: '4', description: 'Demontare echipament vechi', amount: 150 },
];

interface ChecklistItem {
    id: string;
    label: string;
}

const QUALITY_CHECKLIST: ChecklistItem[] = [
    { id: 'vacuum', label: 'Vidare instalație (minim 15 min)' },
    { id: 'leak_test', label: 'Verificare etanșeitate bercluri/îmbinări' },
    { id: 'drain_test', label: 'Probă condens (turnare apă pe tavă)' },
    { id: 'power_test', label: 'Probă de funcționare (rece/cald)' },
    { id: 'clean_up', label: 'Curățenie la locul instalării' },
    { id: 'customer_demo', label: 'Instruire client (utilizare telecomandă)' },
];

export default function JobDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { getJobById, completeJob, cancelJob } = useJobs();

    const [permission, requestPermission] = useCameraPermissions();
    const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');
    const [isDocsModalVisible, setIsDocsModalVisible] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState({ pv: true, garantie: true, factura: false });
    const [serialInternal, setSerialInternal] = useState('');
    const [serialExternal, setSerialExternal] = useState('');
    const [activeScanner, setActiveScanner] = useState<'internal' | 'external' | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);

    // Extra Costs State
    const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
    const [isExtraModalVisible, setIsExtraModalVisible] = useState(false);
    const [customExtraName, setCustomExtraName] = useState('');
    const [customExtraPrice, setCustomExtraPrice] = useState('');

    // Checklist State
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [isChecklistModalVisible, setIsChecklistModalVisible] = useState(false);

    // Cancel Job State
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Tools State
    const [isLevelerVisible, setIsLevelerVisible] = useState(false);
    const [levelData, setLevelData] = useState({ x: 0, y: 0, z: 0 });
    const [isFlashlightOn, setIsFlashlightOn] = useState(false);
    const [mockLevelSub, setMockLevelSub] = useState<any>(null);

    const job = getJobById(id as string);

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };

    if (!job) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <MaterialIcons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lucrare Inexistentă</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text>Lucrarea nu a fost găsită.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleCall = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(`tel:${job.phone || '0700000000'}`);
    };

    const handleNavigation = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const url = Platform.select({
            ios: `maps:0,0?q=${job.address}`,
            android: `geo:0,0?q=${job.address}`,
            web: `https://www.google.com/maps/search/?api=1&query=${job.address}`,
        });
        if (url) Linking.openURL(url);
    };

    const handleUploadMedia = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === 'web') {
            alert("Deschide galeria camerei pentru a selecta imagini sau clipuri video.");
        }
        setActiveTab('media');
    };

    const handleConfirmGenerate = () => {
        if ((selectedDocs.pv || selectedDocs.garantie) && (!serialInternal || !serialExternal)) {
            if (Platform.OS === 'web') alert("Te rugăm să completezi ambele serii (Internă și Externă) pentru a genera Garanția / P.V.");
            return;
        }

        if (selectedDocs.pv && !signature) {
            if (Platform.OS === 'web') alert("Semnătura clientului este obligatorie pentru Procesul Verbal.");
            return;
        }

        setIsDocsModalVisible(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const generated = [];
        if (selectedDocs.pv) generated.push('Proces Verbal');
        if (selectedDocs.garantie) generated.push('Garanție');
        if (selectedDocs.factura) generated.push('Factură');

        if (generated.length === 0) {
            if (Platform.OS === 'web') alert("Nu ai selectat niciun document.");
            return;
        }

        if (Platform.OS === 'web') {
            alert(`Documente generate cu succes:\n- ${generated.join('\n- ')}\n\nSerii:\nInternă: ${serialInternal || '-'}\nExternă: ${serialExternal || '-'}\n\nSemnat: ${signature ? 'DA' : 'NU'}`);
        }
    };

    const handleComplete = () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeJob(job.id);
        if (Platform.OS === 'web') {
            alert("Lucrarea a fost marcată ca finalizată!");
        }
        handleGoBack();
    };

    const handleCancelJob = () => {
        if (!cancelReason.trim()) {
            if (Platform.OS === 'web') alert("Te rugăm să introduci un motiv valid.");
            return;
        }
        setIsCancelModalVisible(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Context will handle this
        cancelJob(job.id, cancelReason); // We'll add this to context

        if (Platform.OS === 'web') alert("Cererea de anulare a fost preluată.");
        handleGoBack();
    };

    const handleOpenScanner = async (type: 'internal' | 'external') => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                alert("Avem nevoie de acces la cameră pentru a scana codul de bare.");
                return;
            }
        }
        setActiveScanner(type);
    };

    const handleAddPredefinedExtra = (extra: { description: string, amount: number }) => {
        setExtraCosts([...extraCosts, { description: extra.description, amount: extra.amount.toString(), id: Date.now().toString(), quantity: '1' }]);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAddCustomExtra = () => {
        if (!customExtraName || !customExtraPrice) return;
        setExtraCosts([...extraCosts, { id: Date.now().toString(), description: customExtraName, amount: customExtraPrice, quantity: '1' }]);
        setCustomExtraName('');
        setCustomExtraPrice('');
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleRemoveExtra = (id: string) => {
        setExtraCosts(extraCosts.filter(e => e.id !== id));
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const updateExtraQuantity = (id: string, qtyText: string) => {
        setExtraCosts(prev => prev.map(e => e.id === id ? { ...e, quantity: qtyText } : e));
    };

    const updateExtraAmount = (id: string, amountText: string) => {
        setExtraCosts(prev => prev.map(e => e.id === id ? { ...e, amount: amountText } : e));
    };

    const totalExtraCost = extraCosts.reduce((sum, item) => {
        const amt = parseFloat(item.amount) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (amt * qty);
    }, 0);

    const isChecklistComplete = QUALITY_CHECKLIST.every(item => checklist[item.id]);

    const handleBarcodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (activeScanner === 'internal') {
            setSerialInternal(data);
        } else if (activeScanner === 'external') {
            setSerialExternal(data);
        }
        setActiveScanner(null); // Close scanner
    };

    const toggleLeveler = () => {
        if (isLevelerVisible) {
            if (mockLevelSub) {
                mockLevelSub.remove();
                setMockLevelSub(null);
            }
            Accelerometer.removeAllListeners();
            setIsLevelerVisible(false);
        } else {
            setIsLevelerVisible(true);
            if (Platform.OS === 'web') {
                // Mock for web
                let time = 0;
                const sub = setInterval(() => {
                    time += 0.1;
                    setLevelData({ x: Math.sin(time) * 0.1, y: Math.cos(time) * 0.1, z: 0 });
                }, 100);
                setMockLevelSub({ remove: () => clearInterval(sub) });
            } else {
                Accelerometer.setUpdateInterval(50);
                Accelerometer.addListener(accelerometerData => {
                    setLevelData(accelerometerData);
                });
            }
        }
    };

    const toggleFlashlight = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                alert("Avem nevoie de acces la cameră pentru lanternă.");
                return;
            }
        }
        setIsFlashlightOn(!isFlashlightOn);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalii Lucrare</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* SEGMENTED CONTROL / TABS */}
            <View style={styles.segmentedControl}>
                <TouchableOpacity
                    style={[styles.segmentButton, activeTab === 'info' && styles.segmentActive]}
                    onPress={() => setActiveTab('info')}
                >
                    <Text style={[styles.segmentText, activeTab === 'info' && styles.segmentTextActive]}>Informații</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segmentButton, activeTab === 'media' && styles.segmentActive]}
                    onPress={() => setActiveTab('media')}
                >
                    <Text style={[styles.segmentText, activeTab === 'media' && styles.segmentTextActive]}>Galerie Media</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'info' ? (
                    <>
                        <View style={styles.topMetaInfo}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {job.status === 'in_progress' || job.status === 'pending' ? 'ÎN LUCRU' : (job.status ? job.status.toUpperCase() : 'NECUNOSCUT')}
                                </Text>
                            </View>
                            <Text style={styles.jobId}>
                                {`#${job.id.toUpperCase()}`}
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Client & Adresă</Text>
                            <Text style={styles.clientName}>{job.client}</Text>

                            <View style={styles.addressRow}>
                                <MaterialIcons name="location-pin" size={20} color="#6B7280" />
                                <Text style={styles.addressText}>{job.address}</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.actionButton, styles.callBtn]} onPress={handleCall}>
                                    <MaterialIcons name="call" size={20} color="#16A34A" />
                                    <Text style={[styles.actionButtonText, { color: '#16A34A' }]}>Sună Clientul</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionButton, styles.navBtn]} onPress={handleNavigation}>
                                    <MaterialIcons name="navigation" size={20} color="#2563EB" />
                                    <Text style={[styles.actionButtonText, { color: '#2563EB' }]}>Navigare GPS</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {job.products && job.products.length > 0 ? (
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Produse de instalat</Text>
                                {job.products.map((prod, idx) => (
                                    <View key={idx} style={styles.productRow}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.productText}>{prod}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        {job.notes ? (
                            <View style={styles.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <MaterialIcons name="info-outline" size={20} color="#D97706" />
                                    <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8, color: '#D97706' }]}>
                                        Observații Suplimentare
                                    </Text>
                                </View>
                                <Text style={styles.notesText}>{job.notes}</Text>
                            </View>
                        ) : null}

                        <View style={styles.card}>
                            <View style={styles.earningRow}>
                                <Text style={styles.earningText}>Suma încasată de instalator (TVA inclus)</Text>
                                <Text style={styles.earningAmount}>{job.amount || '450 RON'}</Text>
                            </View>
                        </View>

                        {/* EXTRA COSTS SECTION */}
                        <View style={styles.card}>
                            <View style={[styles.cardHeader, { marginBottom: 12 }]}>
                                <MaterialIcons name="payments" size={24} color="#4B5563" />
                                <Text style={styles.cardTitle}>Costuri Suplimentare</Text>
                            </View>

                            {extraCosts.length > 0 ? (
                                <View style={styles.extraCostsList}>
                                    {extraCosts.map((extra) => {
                                        const parsedAmt = parseFloat(extra.amount) || 0;
                                        const parsedQty = parseInt(extra.quantity) || 0;
                                        return (
                                            <View key={extra.id} style={styles.extraCostItem}>
                                                <View style={styles.extraCostInfo}>
                                                    <Text style={styles.extraCostDesc}>{extra.description}</Text>
                                                    <View style={styles.extraCostEditRow}>
                                                        <View style={styles.extraCostInputWrapper}>
                                                            <Text style={styles.extraCostInputLabel}>BUC.</Text>
                                                            <TextInput
                                                                style={styles.extraCostSmallInput}
                                                                value={extra.quantity}
                                                                onChangeText={(val) => updateExtraQuantity(extra.id, val)}
                                                                keyboardType="numeric"
                                                            />
                                                        </View>
                                                        <Text style={styles.extraCostMultiplier}>x</Text>
                                                        <View style={styles.extraCostInputWrapper}>
                                                            <Text style={styles.extraCostInputLabel}>PREȚ (RON)</Text>
                                                            <TextInput
                                                                style={[styles.extraCostSmallInput, { width: 80 }]}
                                                                value={extra.amount}
                                                                onChangeText={(val) => updateExtraAmount(extra.id, val)}
                                                                keyboardType="numeric"
                                                            />
                                                        </View>
                                                        <Text style={styles.extraCostItemTotal}>= {parsedAmt * parsedQty} RON</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleRemoveExtra(extra.id)} style={styles.removeExtraBtn}>
                                                    <MaterialIcons name="close" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        )
                                    })}
                                    <View style={styles.totalExtraContainer}>
                                        <Text style={styles.totalExtraLabel}>Total Suplimentar:</Text>
                                        <Text style={styles.totalExtraValue}>+{totalExtraCost} RON</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.noExtraCostsText}>Nu există costuri / materiale extra adăugate.</Text>
                            )}

                            <TouchableOpacity
                                style={styles.addExtraButton}
                                onPress={() => setIsExtraModalVisible(true)}
                            >
                                <MaterialIcons name="add-circle-outline" size={20} color="#2563EB" />
                                <Text style={styles.addExtraButtonText}>Adaugă Cost Extra / Materiale</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.card}>
                            <View style={[styles.cardHeader, { marginBottom: 12 }]}>
                                <MaterialIcons name="fact-check" size={24} color="#4B5563" />
                                <Text style={styles.cardTitle}>Checklist Calitate</Text>
                            </View>
                            <Text style={styles.modalSubtitle}>Bifați toți pașii obligatorii pentru a putea finaliza lucrarea.</Text>

                            <View style={styles.checklistContainer}>
                                {QUALITY_CHECKLIST.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.checklistItem}
                                        onPress={() => {
                                            setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                                        }}
                                    >
                                        <View style={[styles.checkboxIcon, checklist[item.id] && styles.checkboxIconChecked]}>
                                            {checklist[item.id] && <MaterialIcons name="check" size={16} color="#FFF" />}
                                        </View>
                                        <Text style={[styles.checklistLabel, checklist[item.id] && styles.checklistLabelChecked]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.bottomActions}>
                            <TouchableOpacity style={styles.mediaButton} onPress={handleUploadMedia}>
                                <MaterialIcons name="add-photo-alternate" size={24} color="#374151" />
                                <Text style={styles.mediaButtonText}>Încarcă Media (Poze/Video)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.docsButton} onPress={() => setIsDocsModalVisible(true)}>
                                <MaterialIcons name="description" size={24} color="#2563EB" />
                                <Text style={styles.docsButtonText}>Generează Documente</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.completeButton, !isChecklistComplete && styles.completeButtonDisabled]}
                                onPress={handleComplete}
                                disabled={!isChecklistComplete}
                            >
                                <MaterialIcons name="check-circle" size={24} color={isChecklistComplete ? "#FFF" : "#9CA3AF"} />
                                <Text style={[styles.completeButtonText, !isChecklistComplete && styles.completeButtonTextDisabled]}>
                                    Marchează Finalizată
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelJobButton}
                                onPress={() => setIsCancelModalVisible(true)}
                            >
                                <MaterialIcons name="cancel" size={24} color="#EF4444" />
                                <Text style={styles.cancelJobButtonText}>Anulează Lucrarea</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    /* MEDIA GALLERY TAB */
                    <View style={styles.galleryContainer}>
                        <View style={styles.emptyGalleryIconWrapper}>
                            <MaterialIcons name="photo-library" size={56} color="#9CA3AF" />
                        </View>
                        <Text style={styles.galleryEmptyTitle}>Niciun fișier media</Text>
                        <Text style={styles.galleryEmptyText}>Aici vor apărea pozele și clipurile video încărcate pentru această lucrare în vederea validării.</Text>

                        <TouchableOpacity style={styles.galleryUploadButton} onPress={handleUploadMedia}>
                            <MaterialIcons name="cloud-upload" size={20} color="#FFF" />
                            <Text style={styles.galleryUploadText}>Încarcă Fișiere Acum</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* DOCUMENT GENERATION MODAL */}
            <Modal visible={isDocsModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Generează Documente</Text>
                            <TouchableOpacity onPress={() => setIsDocsModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Selectează documentele pe care dorești să le generezi cu datele clientului:</Text>

                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedDocs(s => ({ ...s, pv: !s.pv }))}>
                                <MaterialIcons name={selectedDocs.pv ? "check-box" : "check-box-outline-blank"} size={26} color={selectedDocs.pv ? "#2563EB" : "#9CA3AF"} />
                                <Text style={[styles.checkboxLabel, selectedDocs.pv && styles.checkboxLabelActive]}>Proces Verbal de Recepție</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedDocs(s => ({ ...s, garantie: !s.garantie }))}>
                                <MaterialIcons name={selectedDocs.garantie ? "check-box" : "check-box-outline-blank"} size={26} color={selectedDocs.garantie ? "#2563EB" : "#9CA3AF"} />
                                <Text style={[styles.checkboxLabel, selectedDocs.garantie && styles.checkboxLabelActive]}>Certificat de Garanție</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSelectedDocs(s => ({ ...s, factura: !s.factura }))}>
                                <MaterialIcons name={selectedDocs.factura ? "check-box" : "check-box-outline-blank"} size={26} color={selectedDocs.factura ? "#2563EB" : "#9CA3AF"} />
                                <Text style={[styles.checkboxLabel, selectedDocs.factura && styles.checkboxLabelActive]}>Factură Fiscală</Text>
                            </TouchableOpacity>
                        </View>

                        {(selectedDocs.pv || selectedDocs.garantie) && (
                            <View style={styles.serialInputsContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Serie Unitate Internă (U.I.)</Text>
                                    <View style={styles.serialInputWrapper}>
                                        <TextInput
                                            style={styles.serialInputWithIcon}
                                            placeholder="EX: A1B2C3D4..."
                                            placeholderTextColor="#9CA3AF"
                                            value={serialInternal}
                                            onChangeText={setSerialInternal}
                                            autoCapitalize="characters"
                                        />
                                        <TouchableOpacity style={styles.scanButton} onPress={() => handleOpenScanner('internal')}>
                                            <MaterialIcons name="qr-code-scanner" size={24} color="#2563EB" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Serie Unitate Externă (U.E.)</Text>
                                    <View style={styles.serialInputWrapper}>
                                        <TextInput
                                            style={styles.serialInputWithIcon}
                                            placeholder="EX: X9Y8Z7W6..."
                                            placeholderTextColor="#9CA3AF"
                                            value={serialExternal}
                                            onChangeText={setSerialExternal}
                                            autoCapitalize="characters"
                                        />
                                        <TouchableOpacity style={styles.scanButton} onPress={() => handleOpenScanner('external')}>
                                            <MaterialIcons name="qr-code-scanner" size={24} color="#2563EB" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {selectedDocs.pv && (
                            <View style={styles.signatureSection}>
                                <Text style={styles.inputLabel}>Semnătură Client (Obligatoriu)</Text>
                                <TouchableOpacity
                                    style={[styles.signaturePreviewBox, signature ? styles.signaturePreviewBoxFilled : null]}
                                    onPress={() => setIsSigning(true)}
                                >
                                    {signature ? (
                                        <View style={styles.signatureImageContainer}>
                                            <MaterialIcons name="done" size={24} color="#10B981" />
                                            <Text style={styles.signatureDoneText}>Semnatura a fost înregistrată</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.signaturePlaceholder}>
                                            <MaterialIcons name="draw" size={32} color="#9CA3AF" />
                                            <Text style={styles.signaturePlaceholderText}>Apasă aici pentru a semna</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {signature && (
                                    <TouchableOpacity onPress={() => setSignature(null)}>
                                        <Text style={styles.clearSignatureText}>Șterge și semnează din nou</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <TouchableOpacity style={styles.generateActionButton} onPress={handleConfirmGenerate}>
                            <Text style={styles.generateActionText}>Generează și Trimite</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* CAMERA MODAL */}
            {activeScanner && (
                <Modal visible={true} transparent={false} animationType="slide">
                    <SafeAreaView style={styles.cameraContainer}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity onPress={() => setActiveScanner(null)} style={styles.cameraCloseBtn}>
                                <MaterialIcons name="close" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.cameraTitle}>Scanează Cod de Bare ({activeScanner === 'internal' ? 'Internă' : 'Externă'})</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <CameraView
                            style={styles.camera}
                            facing="back"
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr", "ean13", "ean8", "pdf417", "aztec", "datamatrix", "code39", "code93", "code128", "upc_a", "upc_e"],
                            }}
                            onBarcodeScanned={handleBarcodeScanned}
                        >
                            <View style={styles.scannerOverlay}>
                                <View style={styles.scannerTarget} />
                                <Text style={styles.scannerInstruction}>Poziționează codul pe centrul ecranului</Text>
                            </View>
                        </CameraView>
                    </SafeAreaView>
                </Modal>
            )}

            {/* SIGNATURE MODAL */}
            {isSigning && (
                <Modal visible={true} transparent={false} animationType="slide" supportedOrientations={['portrait', 'landscape']}>
                    <SafeAreaView style={styles.signatureModalContainer}>
                        <View style={styles.signatureHeader}>
                            <TouchableOpacity onPress={() => setIsSigning(false)} style={styles.cameraCloseBtn}>
                                <MaterialIcons name="close" size={28} color="#374151" />
                            </TouchableOpacity>
                            <Text style={styles.signatureTitle}>Semnătură Client</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <View style={styles.signaturePadWrapper}>
                            {Platform.OS === 'web' ? (
                                <View style={styles.webSignatureFallback}>
                                    <MaterialIcons name="computer" size={64} color="#9CA3AF" />
                                    <Text style={styles.webSignatureText}>Funcția de semnătură digitală este disponibilă doar în aplicația instalată pe telefon (iOS / Android).</Text>
                                    <TouchableOpacity
                                        style={styles.webSignatureBypass}
                                        onPress={() => {
                                            setSignature("WEB_BYPASS");
                                            setIsSigning(false);
                                        }}
                                    >
                                        <Text style={styles.webSignatureBypassText}>Bifează ca semnat (Test Web)</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <SignatureScreen
                                    onOK={(sign) => { setSignature(sign); setIsSigning(false); }}
                                    onEmpty={() => { if (Platform.OS === 'web') alert('Vă rugăm să semnați înainte de a salva.'); }}
                                    descriptionText="Semnați aici"
                                    clearText="Șterge"
                                    confirmText="Salvează"
                                    webStyle={`
                                        .m-signature-pad--footer {display: flex; justify-content: space-between; padding: 20px;} 
                                        .m-signature-pad {box-shadow: none; border: none;}
                                    `}
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </Modal>
            )}

            {/* EXTRA COSTS MODAL */}
            {isExtraModalVisible && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Adaugă Cost Extra</Text>
                                <TouchableOpacity onPress={() => setIsExtraModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalSubtitle}>Alege din lista predefinită:</Text>
                            <View style={styles.predefinedExtrasContainer}>
                                {PREDEFINED_EXTRAS.map(extra => (
                                    <TouchableOpacity
                                        key={extra.id}
                                        style={styles.predefinedExtraBtn}
                                        onPress={() => {
                                            handleAddPredefinedExtra(extra);
                                            setIsExtraModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.predefinedExtraDesc}>{extra.description}</Text>
                                        <Text style={styles.predefinedExtraAmount}>+{extra.amount} RON</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.separatorContainer}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>SAU PERSONALIZAT</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            <View style={styles.customExtraForm}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Descriere</Text>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Ex: Teavă suplimentară 1m"
                                        placeholderTextColor="#9CA3AF"
                                        value={customExtraName}
                                        onChangeText={setCustomExtraName}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Preț (RON)</Text>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Ex: 50"
                                        placeholderTextColor="#9CA3AF"
                                        value={customExtraPrice}
                                        onChangeText={setCustomExtraPrice}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.addCustomBtn, (!customExtraName || !customExtraPrice) && styles.addCustomBtnDisabled]}
                                    onPress={() => {
                                        handleAddCustomExtra();
                                        setIsExtraModalVisible(false);
                                    }}
                                    disabled={!customExtraName || !customExtraPrice}
                                >
                                    <Text style={styles.addCustomBtnText}>Adaugă Cost Personalizat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* CANCEL JOB MODAL */}
            {isCancelModalVisible && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Anulare Lucrare</Text>
                                <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.modalSubtitle, { marginBottom: 16 }]}>Te rugăm să oferi un motiv pentru care anulezi această lucrare. Motivul va fi vizibil administratorilor ClimaticPRO.</Text>

                            <TextInput
                                style={[styles.customInput, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="Scrie motivul anulării aici..."
                                placeholderTextColor="#9CA3AF"
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity
                                style={[styles.addCustomBtn, { backgroundColor: '#EF4444', marginTop: 16 }, !cancelReason.trim() && styles.addCustomBtnDisabled]}
                                onPress={handleCancelJob}
                                disabled={!cancelReason.trim()}
                            >
                                <Text style={styles.addCustomBtnText}>Confirmă Anularea</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* LEVELER MODAL */}
            {isLevelerVisible && (
                <View style={styles.levelerOverlay}>
                    <View style={styles.levelerHeader}>
                        <Text style={styles.levelerTitle}>Nivelă (Boloboc)</Text>
                        <TouchableOpacity onPress={toggleLeveler}>
                            <MaterialIcons name="close" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.levelerInstructions}>Așezați telefonul pe unitatea internă sau pe țeavă.</Text>

                    <View style={styles.levelerCircle}>
                        <View style={styles.levelerCrosshairX} />
                        <View style={styles.levelerCrosshairY} />
                        <View
                            style={[
                                styles.levelerBubble,
                                {
                                    transform: [
                                        { translateX: Math.max(Math.min(levelData.x * -100, 75), -75) },
                                        { translateY: Math.max(Math.min(levelData.y * 100, 75), -75) }
                                    ],
                                    backgroundColor: Math.abs(levelData.x) < 0.05 && Math.abs(levelData.y) < 0.05 ? '#10B981' : '#EF4444' // Green if perfectly level, red otherwise
                                }
                            ]}
                        />
                    </View>

                    <Text style={[styles.levelerAngleText, { color: Math.abs(levelData.x) < 0.05 && Math.abs(levelData.y) < 0.05 ? '#10B981' : '#FFF' }]}>
                        {Math.abs(levelData.x) < 0.05 && Math.abs(levelData.y) < 0.05 ? 'PERFECT DREPT' : 'NEALINIAT'}
                    </Text>
                </View>
            )}

            {/* HIDDEN FLASHLIGHT CAMERA (Used just to keep flashlight on) */}
            {isFlashlightOn && Platform.OS !== 'web' && (
                <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
                    <CameraView enableTorch={isFlashlightOn} facing="back" />
                </View>
            )}

            {/* FLOATING TOOLS BAR */}
            <View style={styles.floatingToolsBar}>
                <TouchableOpacity style={styles.floatingToolBtn} onPress={toggleLeveler}>
                    <MaterialIcons name="screen-rotation" size={24} color={isLevelerVisible ? "#2563EB" : "#4B5563"} />
                    <Text style={[styles.floatingToolLabel, isLevelerVisible && { color: "#2563EB" }]}>Nivelă</Text>
                </TouchableOpacity>

                <View style={styles.floatingDivider} />

                <TouchableOpacity style={styles.floatingToolBtn} onPress={toggleFlashlight}>
                    <MaterialIcons name="flashlight-on" size={24} color={isFlashlightOn ? "#F59E0B" : "#4B5563"} />
                    <Text style={[styles.floatingToolLabel, isFlashlightOn && { color: "#F59E0B" }]}>Lanternă</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 16,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    segmentActive: {
        borderBottomColor: '#2563EB',
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    segmentTextActive: {
        color: '#2563EB',
        fontWeight: '800',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: Platform.OS === 'web' ? 100 : 80,
    },
    topMetaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#92400E',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    jobId: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    clientName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    addressText: {
        fontSize: 15,
        color: '#374151',
        marginLeft: 8,
        flex: 1,
        lineHeight: 22,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 100,
        borderWidth: 1,
    },
    callBtn: {
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
    },
    navBtn: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 6,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563EB',
        marginTop: 8,
        marginRight: 10,
    },
    productText: {
        fontSize: 15,
        color: '#1F2937',
        flex: 1,
        lineHeight: 24,
        fontWeight: '500',
    },
    notesText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    earningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    earningText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        paddingRight: 16,
        lineHeight: 18,
    },
    earningAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#059669',
    },
    bottomActions: {
        marginTop: 8,
        gap: 12,
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    mediaButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 8,
    },
    docsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    docsButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2563EB',
        marginLeft: 8,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 100,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginTop: 10,
    },
    completeButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Gallery Tab Styles
    galleryContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyGalleryIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    galleryEmptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    galleryEmptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    galleryUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 100,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    galleryUploadText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 8,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 24,
        lineHeight: 22,
    },
    checkboxContainer: {
        marginBottom: 30,
        gap: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
    checkboxLabelActive: {
        color: '#111827',
        fontWeight: '700',
    },
    generateActionButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
    },
    generateActionText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    serialInputsContainer: {
        marginBottom: 24,
        gap: 16,
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    serialInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    serialInputWithIcon: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    scanButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#E5E7EB',
    },
    serialInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    // Checklist Styles
    checklistContainer: {
        marginTop: 8,
        gap: 12,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    checkboxIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#FFF',
    },
    checkboxIconChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    checklistLabel: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    checklistLabelChecked: {
        color: '#111827',
        fontWeight: '600',
    },
    completeButtonDisabled: {
        backgroundColor: '#E5E7EB',
        borderWidth: 0,
    },
    completeButtonTextDisabled: {
        color: '#9CA3AF',
    },
    cancelJobButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
    },
    cancelJobButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#EF4444',
        marginLeft: 8,
    },

    // Camera Styles
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        zIndex: 10,
    },
    cameraCloseBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    cameraTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    camera: {
        flex: 1,
    },
    scannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerTarget: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
    },
    scannerInstruction: {
        color: '#FFF',
        marginTop: 24,
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    // Signature Styles
    signatureSection: {
        marginBottom: 24,
    },
    signaturePreviewBox: {
        height: 120,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    signaturePreviewBoxFilled: {
        borderStyle: 'solid',
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    signaturePlaceholder: {
        alignItems: 'center',
        opacity: 0.6,
    },
    signaturePlaceholderText: {
        marginTop: 8,
        color: '#6B7280',
        fontWeight: '500',
    },
    signatureImageContainer: {
        alignItems: 'center',
    },
    signatureDoneText: {
        marginTop: 8,
        color: '#10B981',
        fontWeight: '700',
    },
    clearSignatureText: {
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '600',
        fontSize: 14,
    },
    signatureModalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    signatureHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    signatureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    signaturePadWrapper: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    webSignatureFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    webSignatureText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    webSignatureBypass: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
    },
    webSignatureBypassText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    // Extra Costs Styles
    extraCostEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    extraCostInputWrapper: {
        flexDirection: 'column',
    },
    extraCostInputLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    extraCostSmallInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#F9FAFB',
        width: 60,
        textAlign: 'center',
    },
    extraCostMultiplier: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 16,
    },
    extraCostItemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 'auto',
        marginTop: 16,
    },
    extraCostsList: {
        marginBottom: 16,
    },
    extraCostItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    extraCostInfo: {
        flex: 1,
    },
    extraCostDesc: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    extraCostAmount: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    removeExtraBtn: {
        padding: 8,
    },
    totalExtraContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    totalExtraLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    totalExtraValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    noExtraCostsText: {
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    addExtraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderStyle: 'dashed',
    },
    addExtraButtonText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    predefinedExtrasContainer: {
        gap: 8,
    },
    predefinedExtraBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        borderRadius: 8,
    },
    predefinedExtraDesc: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    predefinedExtraAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 12,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    separatorText: {
        color: '#9CA3AF',
        paddingHorizontal: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    customExtraForm: {
        gap: 16,
    },
    customInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    addCustomBtn: {
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    addCustomBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    addCustomBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    // Floating Tools Bar
    floatingToolsBar: {
        position: 'absolute',
        bottom: Platform.OS === 'web' ? 24 : 40,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
        gap: 12,
    },
    floatingToolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 6,
    },
    floatingToolLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
    },
    floatingDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
    },
    // Leveler UI
    levelerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelerHeader: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    levelerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    levelerInstructions: {
        position: 'absolute',
        top: 120,
        color: '#9CA3AF',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    levelerCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 4,
        borderColor: '#4B5563',
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    levelerCrosshairX: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: '#4B5563',
    },
    levelerCrosshairY: {
        position: 'absolute',
        width: 2,
        height: '100%',
        backgroundColor: '#4B5563',
    },
    levelerBubble: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EF4444', // Red when off, Green when aligned
        position: 'absolute',
    },
    levelerAngleText: {
        marginTop: 40,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    }
});
