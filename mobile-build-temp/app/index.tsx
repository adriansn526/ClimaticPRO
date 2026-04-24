import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            try {
                let token;
                if (Platform.OS === 'web') {
                    token = localStorage.getItem('userToken');
                } else {
                    token = await SecureStore.getItemAsync('userToken');
                }

                if (token) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/login');
                }
            } catch (e) {
                console.error("Error reading token", e);
                router.replace('/login');
            }
        }
        checkAuth();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
    );
}
