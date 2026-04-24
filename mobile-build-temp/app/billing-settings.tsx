import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function BillingSettingsScreen() {
    const router = useRouter();
    const [provider, setProvider] = useState<'smartbill' | 'fgo' | 'oblio' | null>(null);
    const [token, setToken] = useState('');
    const [series, setSeries] = useState('');
    const [spvToken, setSpvToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Fetch current settings from backend (mocked for now)
        setIsLoading(true);
        setTimeout(() => {
            setProvider('fgo');
            setToken('FGO_API_KEY_EXAMPLE_123');
            setSeries('CLIM');
            setIsLoading(false);
        }, 800);
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    const handleSave = () => {
        setIsSaving(true);
        // TODO: Call API to save settings
        setTimeout(() => {
            setIsSaving(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (Platform.OS === 'web') alert('Setările au fost salvate cu succes!');
            router.back();
        }, 1000);
    };

    const ProviderOption = ({ type, name, icon }: { type: 'smartbill' | 'fgo' | 'oblio', name: string, icon: string }) => (
        <TouchableOpacity
            style={[styles.providerCard, provider === type && styles.providerCardActive]}
            onPress={() => {
                setProvider(type);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
            }}
        >
            <View style={styles.providerIconWrapper}>
                <MaterialIcons name={icon as any} size={24} color={provider === type ? "#2563EB" : "#6B7280"} />
            </View>
            <Text style={[styles.providerName, provider === type && styles.providerNameActive]}>{name}</Text>
            <View style={styles.radioOut}>
                {provider === type && <View style={styles.radioIn} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Facturare & SPV</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoBox}>
                    <MaterialIcons name="info-outline" size={20} color="#0369A1" />
                    <Text style={styles.infoText}>Configurează aplicația să genereze automat facturile fiscale la finalizarea lucrărilor și conectează-te cu SPV ANAF pentru preluarea stocurilor.</Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* INVOICING PROVIDER */}
                        <Text style={styles.sectionTitle}>Program de Facturare</Text>

                        <View style={styles.providersContainer}>
                            <ProviderOption type="fgo" name="FGO.ro" icon="receipt-long" />
                            <ProviderOption type="smartbill" name="SmartBill" icon="request-quote" />
                            <ProviderOption type="oblio" name="Oblio" icon="description" />
                        </View>

                        {provider && (
                            <View style={styles.credentialsBox}>
                                <Text style={styles.inputLabel}>Cod Autorizare (API Token/Key) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: fk39dk2...93kd"
                                    value={token}
                                    onChangeText={setToken}
                                    secureTextEntry
                                />
                                <Text style={styles.inputHint}>Găsești acest cod în contul tău {provider.toUpperCase()} la secțiunea Integrări / API.</Text>

                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Serie Factură Implicită</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: CLIM"
                                    value={series}
                                    onChangeText={setSeries}
                                    autoCapitalize="characters"
                                />
                                <Text style={styles.inputHint}>Aceasta va fi seria folosită pentru facturile emise automat de ClimaticPRO.</Text>
                            </View>
                        )}

                        {/* SPV ANAF */}
                        <View style={styles.spvSection}>
                            <View style={styles.spvHeader}>
                                <MaterialIcons name="account-balance" size={24} color="#15803D" />
                                <Text style={styles.spvTitle}>Integrare SPV ANAF</Text>
                            </View>
                            <Text style={styles.spvDesc}>Când conectezi SPV-ul, materialele și aparatele AC comandate vor intra automat în stocul tău de piese de îndată ce primești e-Factura de la furnizor.</Text>

                            <TouchableOpacity style={styles.spvConnectBtn}>
                                <Text style={styles.spvConnectBtnText}>Conectează cont SPV (OAuth)</Text>
                                <MaterialIcons name="open-in-browser" size={20} color="#15803D" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveBtnText}>Salvează Setările</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E0F2FE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        color: '#0369A1',
        fontSize: 13,
        lineHeight: 20,
        marginLeft: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    providersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    providerCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    providerCardActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    providerIconWrapper: {
        marginBottom: 8,
    },
    providerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 12,
    },
    providerNameActive: {
        color: '#2563EB',
    },
    radioOut: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioIn: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB',
    },
    credentialsBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#111827',
    },
    inputHint: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 6,
        fontStyle: 'italic',
    },
    spvSection: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    spvHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    spvTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#15803D',
        marginLeft: 8,
    },
    spvDesc: {
        fontSize: 13,
        color: '#166534',
        lineHeight: 20,
        marginBottom: 16,
    },
    spvConnectBtn: {
        backgroundColor: '#DCFCE7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#22C55E',
    },
    spvConnectBtnText: {
        color: '#15803D',
        fontSize: 14,
        fontWeight: '700',
        marginRight: 8,
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
