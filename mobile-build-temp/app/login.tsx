import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { fetchWithAuth, API_BASE_URL } from '../utils/api';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Eroare', 'Te rugăm să completezi ambele câmpuri.');
            return;
        }

        setIsLoading(true);

        try {
            console.log('[LOGIN] Starting authentication request...');
            const response = await fetchWithAuth('/mobile/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            console.log('[LOGIN] Auth request completed:', response);
            const data = response;

            if (data.success && data.token) {
                console.log('[LOGIN] Success! Setting token...');
                if (Platform.OS === 'web') {
                    localStorage.setItem('userToken', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    console.log('[LOGIN] Web storage set. Redirecting to /(tabs)...');
                } else {
                    await SecureStore.setItemAsync('userToken', data.token);
                    await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
                    console.log('[LOGIN] Native storage set. Redirecting to /(tabs)...');
                }
                router.replace('/(tabs)');
                console.log('[LOGIN] Router replace fired.');
            } else {
                console.warn('[LOGIN] Auth failed:', data.message);
                Alert.alert('Eroare', data.message || 'Login eșuat.');
            }
        } catch (error: any) {
            console.error('[LOGIN] Error caught:', error);
            Alert.alert('Eroare', error.message || 'Nu am putut conecta la server.');
        } finally {
            console.log('[LOGIN] Resetting loading state...');
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>ClimaticPRO</Text>
                    </View>
                    <Text style={styles.subtitle}>Portal Instalatori</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Email sau Telefon</Text>
                    <View>
                        <TextInput
                            style={styles.input}
                            placeholder="Introduceți adresa de email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <Text style={styles.label}>Parolă</Text>
                    <View>
                        <TextInput
                            style={styles.input}
                            placeholder="Introduceți parola"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Ați uitat parola?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Autentificare</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>Conectându-te, ești de acord cu Termenii și Condițiile de parteneriat.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoPlaceholder: {
        width: 64,
        height: 64,
        backgroundColor: '#2563EB',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#1F2937',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        marginTop: 32,
        textAlign: 'center',
        fontSize: 12,
        color: '#6B7280',
        paddingHorizontal: 24,
    }
});
