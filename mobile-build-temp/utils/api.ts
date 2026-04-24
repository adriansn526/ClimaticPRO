import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use local network IP for Expo Go / emulator, or production URL
// Example for Android Emulator: "http://10.0.2.2:3000/api"
// Example for iOS Simulator: "http://localhost:3000/api"
// Replace with your local machine's IP (e.g. 192.168.1.xxx) for physical device testing
export const API_BASE_URL = 'http://localhost:3010/api';

/**
 * Helper function to inject JWT Token into fetch requests automatically.
 */
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    let token = null;

    if (Platform.OS === 'web') {
        token = localStorage.getItem('userToken');
    } else {
        token = await SecureStore.getItemAsync('userToken');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    // Some endpoints on Next.js might not yet verify Bearer tokens, 
    // but attaching it is best practice for future protected routes.
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Provide detailed error if response is not ok
    if (!response.ok) {
        let errorMessage = 'Network response was not ok';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Text fallback
            errorMessage = await response.text();
        }
        console.error(`[fetchWithAuth] HTTP Error ${response.status} on ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
    }

    return response.json();
};
