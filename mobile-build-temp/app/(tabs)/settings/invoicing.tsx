import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchWithAuth } from '../../../utils/api';

export default function InvoicingSettingsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [provider, setProvider] = useState<'smartbill' | 'fgo' | 'oblio' | ''>('');
    const [billingToken, setBillingToken] = useState('');
    const [billingSeries, setBillingSeries] = useState('');
    const [spvToken, setSpvToken] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await fetchWithAuth('/mobile/settings/invoicing');
            if (data.success) {
                setProvider(data.billingProvider || '');
                setBillingToken(data.billingToken || '');
                setBillingSeries(data.billingSeries || '');
                setSpvToken(data.spvToken || '');
            }
        } catch (error) {
            console.error('Failed to load invoicing settings', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                billingProvider: provider,
                billingToken,
                billingSeries,
                spvToken
            };

            const data = await fetchWithAuth('/mobile/settings/invoicing', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (data.success) {
                Alert.alert('Succes', 'Setările de facturare au fost salvate.');
                router.back();
            } else {
                Alert.alert('Eroare', data.message || 'Eroare la salvare.');
            }
        } catch (error: any) {
            Alert.alert('Eroare', error.message || 'A apărut o eroare.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0056b3" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" color="#1f2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Facturare & SPV</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.infoBox}>
                    <MaterialIcons name="security" color="#2563eb" size={24} style={{ marginRight: 12 }} />
                    <Text style={styles.infoText}>
                        Aceste credențiale sunt criptate și folosite exclusiv pentru a emite facturi automate și a citi e-Factura din SPV (stocuri).
                    </Text>
                </View>

                {/* Billing Provider */}
                <Text style={styles.sectionTitle}>Program Facturare</Text>
                <View style={styles.providerGrid}>
                    {['smartbill', 'fgo', 'oblio'].map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.providerCard, provider === opt && styles.providerCardActive]}
                            onPress={() => setProvider(opt as any)}
                        >
                            <MaterialIcons name="receipt-long" color={provider === opt ? '#2563eb' : '#6b7280'} size={24} />
                            <Text style={[styles.providerText, provider === opt && styles.providerTextActive]}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* API Credentials */}
                <Text style={styles.sectionTitle}>Setări API Facturare</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Token API (Cod Integrator)</Text>
                    <TextInput
                        style={styles.input}
                        value={billingToken}
                        onChangeText={setBillingToken}
                        placeholder="Ex: a1b2c3d4e5f6..."
                        autoCapitalize="none"
                        secureTextEntry
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Seria pentru Emitere Facturi</Text>
                    <TextInput
                        style={styles.input}
                        value={billingSeries}
                        onChangeText={setBillingSeries}
                        placeholder="Ex: FFC, INV"
                        autoCapitalize="characters"
                    />
                    <Text style={styles.hintText}>Lăsați gol pentru a folosi seria implicită.</Text>
                </View>

                {/* SPV Integration */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Integrare E-Factura (SPV)</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Token SPV ANAF</Text>
                    <TextInput
                        style={styles.input}
                        value={spvToken}
                        onChangeText={setSpvToken}
                        placeholder="Valabil 90 de zile conform Oauth2"
                        autoCapitalize="none"
                        secureTextEntry
                    />
                    <Text style={styles.hintText}>Preluăm automat stocurile (Aparate AC, Grile, Tevi) de pe facturile primite în SPV pe CUI-ul companiei locale.</Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="save" color="#fff" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Salvează Configurația</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center'
    },
    infoText: { flex: 1, color: '#1e3a8a', fontSize: 14, lineHeight: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
    providerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    providerCard: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginHorizontal: 4,
    },
    providerCardActive: {
        borderColor: '#2563eb',
        backgroundColor: '#f0fdf4',
    },
    providerText: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#6b7280' },
    providerTextActive: { color: '#2563eb', fontWeight: '700' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#4b5563', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827'
    },
    hintText: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#0056b3',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
