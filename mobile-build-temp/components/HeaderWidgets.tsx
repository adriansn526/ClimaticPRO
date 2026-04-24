import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function GlobalHeaderRight() {
    return (
        <TouchableOpacity style={styles.notificationBtn}>
            <MaterialIcons name="notifications-none" size={24} color="#4B5563" />
            <View style={styles.notificationDot} />
        </TouchableOpacity>
    );
}

export function GlobalHeaderLeft() {
    const [temperature, setTemperature] = useState<number | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Fetch current temp for Bucharest
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.4323&longitude=26.1063&current_weather=true');
                const data = await res.json();
                if (data && data.current_weather) {
                    setTemperature(Math.round(data.current_weather.temperature));
                }
            } catch (err) { }
        };
        fetchWeather();
    }, []);

    return (
        <View style={styles.brandLeft}>
            <View style={styles.logoBadge}>
                <Text style={styles.logoText}>C</Text>
            </View>
            <View>
                <Text style={styles.brandTitle}>ClimaticPRO</Text>
                {temperature !== null ? (
                    <View style={styles.weatherRow}>
                        <MaterialIcons name="thermostat" size={12} color="#D97706" />
                        <Text style={styles.weatherText}>{temperature}°C afară</Text>
                    </View>
                ) : (
                    <View style={styles.weatherRow}>
                        <Text style={styles.weatherText}>Se încarcă...</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
    },
    logoBadge: {
        width: 36,
        height: 36,
        backgroundColor: '#2563EB',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logoText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 18,
    },
    brandTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    weatherText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginLeft: 2,
    },
    notificationBtn: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 16,
    },
    notificationDot: {
        position: 'absolute',
        top: 6,
        right: 8,
        width: 10,
        height: 10,
        backgroundColor: '#EF4444',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#F3F4F6',
    }
});
