import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

// Conditional import for maps to avoid web crashes if not properly mocked
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
}

export default function ProfileSettingsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Profile Data
    const [companyName, setCompanyName] = useState('');
    const [cui, setCui] = useState('');
    const [regCom, setRegCom] = useState('');
    const [iban, setIban] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    // Coverage Data
    const [radius, setRadius] = useState(50); // in km
    const [location, setLocation] = useState({
        latitude: 44.4268, // Default Bucharest
        longitude: 26.1025,
        latitudeDelta: 1.5,
        longitudeDelta: 1.5,
    });

    useEffect(() => {
        // Mock fetching data
        setTimeout(() => {
            setCompanyName('InstalExpert SRL');
            setCui('RO12345678');
            setRegCom('J40/1234/2020');
            setIban('RO12INGB1234567890123456');
            setAddress('Str. Exemplu Nr. 10, București');
            setPhone('0722123456');
            setIsLoading(false);
        }, 800);
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (Platform.OS === 'web') alert('Profilul a fost actualizat cu succes.');
            else Alert.alert('Succes', 'Profilul a fost actualizat.');
            router.back();
        }, 1000);
    };

    const handleMapPress = (e: any) => {
        if (Platform.OS !== 'web') {
            const { coordinate } = e.nativeEvent;
            setLocation({
                ...location,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Date Personale</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* Company Info */}
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="business" size={20} color="#4B5563" />
                            <Text style={styles.sectionTitle}>Informații Firmă PFA/SRL</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.inputLabel}>Nume Companie *</Text>
                            <TextInput
                                style={styles.input}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="Numele firmei tale"
                            />

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                    <Text style={styles.inputLabel}>CUI/CIF *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={cui}
                                        onChangeText={setCui}
                                        placeholder="RO..."
                                        autoCapitalize="characters"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Reg. Comerțului</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={regCom}
                                        onChangeText={setRegCom}
                                        placeholder="J..."
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>IBAN</Text>
                            <TextInput
                                style={styles.input}
                                value={iban}
                                onChangeText={setIban}
                                placeholder="RO..."
                                autoCapitalize="characters"
                            />

                            <Text style={styles.inputLabel}>Adresă Sediu</Text>
                            <TextInput
                                style={styles.input}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Adresa completă"
                            />

                            <Text style={styles.inputLabel}>Telefon Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="07xx"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Coverage Area */}
                        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                            <MaterialIcons name="my-location" size={20} color="#4B5563" />
                            <Text style={styles.sectionTitle}>Zonă de Acoperire Lucrări</Text>
                        </View>
                        <Text style={styles.coverageSubtitle}>Alege punctul central (baza) și setează raza maximă în care dorești să primești lucrări de montaj.</Text>

                        <View style={styles.card}>
                            <View style={styles.radiusHeader}>
                                <Text style={styles.radiusLabel}>Rază de acțiune:</Text>
                                <Text style={styles.radiusValue}>{radius} KM</Text>
                            </View>

                            {/* Range Slider for Radius */}
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={5}
                                maximumValue={150}
                                step={5}
                                value={radius}
                                onValueChange={(val: number) => setRadius(val)}
                                minimumTrackTintColor="#2563EB"
                                maximumTrackTintColor="#D1D5DB"
                                thumbTintColor="#2563EB"
                            />

                            {/* Map Viewer */}
                            <View style={styles.mapContainer}>
                                {Platform.OS === 'web' ? (
                                    <View style={styles.webMapFallback}>
                                        <MaterialIcons name="map" size={48} color="#9CA3AF" />
                                        <Text style={styles.webMapText}>Harta interactivă este vizibilă doar în aplicația mobilă instalată pe iOS/Android.</Text>
                                        <Text style={styles.webMapCoords}>Coordonate selectate: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
                                    </View>
                                ) : (
                                    MapView && (
                                        <MapView
                                            style={styles.map}
                                            region={location}
                                            onPress={handleMapPress}
                                        >
                                            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
                                            <Circle
                                                center={{ latitude: location.latitude, longitude: location.longitude }}
                                                radius={radius * 1000} // convert km to meters
                                                strokeWidth={2}
                                                strokeColor="rgba(37, 99, 235, 0.5)"
                                                fillColor="rgba(37, 99, 235, 0.15)"
                                            />
                                        </MapView>
                                    )
                                )}
                            </View>
                            {Platform.OS !== 'web' && (
                                <Text style={styles.mapHint}>Atinge harta pentru a reloca centrul zonei tale de acoperire.</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveBtnText}>Salvează Datele</Text>
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 8,
    },
    coverageSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#111827',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    inputGroup: {
        flexDirection: 'column',
    },
    radiusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    radiusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    radiusValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    mapContainer: {
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    webMapFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    webMapText: {
        textAlign: 'center',
        color: '#4B5563',
        marginTop: 12,
        fontSize: 13,
        lineHeight: 20,
    },
    webMapCoords: {
        marginTop: 8,
        fontWeight: '600',
        color: '#111827',
        fontSize: 12,
    },
    mapHint: {
        fontSize: 11,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
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
