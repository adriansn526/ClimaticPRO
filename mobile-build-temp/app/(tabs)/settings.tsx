import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const loadUserData = async () => {
            let userDataStr = null;
            if (Platform.OS === 'web') {
                userDataStr = localStorage.getItem('userData');
            } else {
                const SecureStore = await import('expo-secure-store');
                userDataStr = await SecureStore.getItemAsync('userData');
            }

            if (userDataStr) {
                try {
                    setUserData(JSON.parse(userDataStr));
                } catch (e) { }
            }
        };
        loadUserData();
    }, []);

    const handleLogout = async () => {
        const executeLogout = async () => {
            if (Platform.OS === 'web') {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
            } else {
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userData');
            }
            router.replace('/login');
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Ești sigur că vrei să te deconectezi?")) {
                await executeLogout();
            }
        } else {
            Alert.alert(
                "Deconectare",
                "Ești sigur că vrei să te deconectezi?",
                [
                    { text: "Renunță", style: "cancel" },
                    {
                        text: "Deconectare",
                        style: "destructive",
                        onPress: executeLogout
                    }
                ]
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            {userData && (
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {userData.name ? userData.name.charAt(0).toUpperCase() : (userData.email ? userData.email.charAt(0).toUpperCase() : 'U')}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userData.name || userData.companyName || 'Instalator Climatic'}</Text>
                        <Text style={styles.profileEmail}>{userData.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>Partener Verificat</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestiune Activitate</Text>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reports')}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                        <MaterialIcons name="insert-chart" size={20} color="#4338CA" />
                    </View>
                    <Text style={styles.menuText}>Rapoarte și Încasări</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/stocks')}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                        <MaterialIcons name="inventory" size={20} color="#D97706" />
                    </View>
                    <Text style={styles.menuText}>Stocuri (Echipamente/Materiale)</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/team')}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                        <MaterialIcons name="group" size={20} color="#15803D" />
                    </View>
                    <Text style={styles.menuText}>Echipa Mea</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Integrare și Cont</Text>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/invoicing')}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                        <MaterialIcons name="receipt-long" size={20} color="#15803D" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[styles.menuText, { marginLeft: 0 }]}>Facturare & SPV</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Conectează ANAF, FGO, SmartBill</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile-settings')}>
                    <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialIcons name="person" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.menuText}>Date Personale</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialIcons name="notifications" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.menuText}>Notificări Push</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aplicație</Text>
                <TouchableOpacity style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialIcons name="help-outline" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.menuText}>Suport Tehnic (Dispecerat)</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.menuText, { color: '#EF4444' }]}>Deconectare</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>ClimaticPRO Installer Portal - v1.1.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    profileHeader: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 6,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#16A34A',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 16,
    },
    version: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 32,
        marginBottom: 80,
        fontSize: 12,
    }
});
