import { Stack } from 'expo-router';
import { JobProvider } from '../context/JobContext';
import { ShopProvider } from '../context/ShopContext';

export default function Layout() {
    return (
        <JobProvider>
            <ShopProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="job/[id]" options={{ presentation: 'modal' }} />
                </Stack>
            </ShopProvider>
        </JobProvider>
    );
}
