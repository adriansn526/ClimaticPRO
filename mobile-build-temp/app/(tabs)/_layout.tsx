import { Tabs, usePathname } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { GlobalHeaderLeft, GlobalHeaderRight } from '../../components/HeaderWidgets';

export default function TabLayout() {
    const pathname = usePathname();
    const isJobDetails = pathname.includes('/job/');

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
                position: 'absolute',
                borderTopWidth: 0,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                height: Platform.OS === 'ios' ? 80 : 65,
                paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                paddingTop: 10,
                display: isJobDetails ? 'none' : 'flex'
            },
            headerStyle: {
                backgroundColor: '#FFFFFF',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                height: Platform.OS === 'ios' ? 110 : 90,
            },
            headerLeft: () => <GlobalHeaderLeft />,
            headerRight: () => <GlobalHeaderRight />,
            headerTitle: '',
            headerTintColor: '#111827',
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Disponibile',
                    tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="active"
                options={{
                    title: 'În Lucru',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="tools" size={20} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Istoric',
                    tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="shop"
                options={{
                    title: 'Magazin',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <MaterialIcons name="storefront" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Setări',
                    tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings/invoicing"
                options={{
                    href: null, // This hides it from the bottom tab bar
                }}
            />
        </Tabs>
    );
}
