import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoryScreen() {
    return (
        <View style={styles.container}>
            <MaterialIcons name="history" size={48} color="#D1D5DB" />
            <Text style={styles.title}>Istoric Lucrări</Text>
            <Text style={styles.text}>Aici vor apărea lucrările finalizate și încasările aferente.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 16,
        marginBottom: 8,
    },
    text: {
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 20,
    }
});
