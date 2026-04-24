import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ReportsScreen() {
    const router = useRouter();
    const [period, setPeriod] = useState<'luna_curenta' | 'luna_trecuta' | 'tot_anul'>('luna_curenta');

    const handleGoBack = () => {
        router.back();
    };

    // Mock data for reports
    const stats = {
        luna_curenta: { completate: 18, anulate: 2, total_incasat: 8100, estimat: 9500 },
        luna_trecuta: { completate: 24, anulate: 1, total_incasat: 10800, estimat: 10800 },
        tot_anul: { completate: 142, anulate: 5, total_incasat: 63900, estimat: 65000 }
    };
    const currentStats = stats[period];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rapoarte Activitate</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Period Selector */}
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        style={[styles.segmentButton, period === 'luna_curenta' && styles.segmentActive]}
                        onPress={() => {
                            setPeriod('luna_curenta');
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                        }}
                    >
                        <Text style={[styles.segmentText, period === 'luna_curenta' && styles.segmentTextActive]}>Luna Curentă</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentButton, period === 'luna_trecuta' && styles.segmentActive]}
                        onPress={() => {
                            setPeriod('luna_trecuta');
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                        }}
                    >
                        <Text style={[styles.segmentText, period === 'luna_trecuta' && styles.segmentTextActive]}>Luna Trecută</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentButton, period === 'tot_anul' && styles.segmentActive]}
                        onPress={() => {
                            setPeriod('tot_anul');
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                        }}
                    >
                        <Text style={[styles.segmentText, period === 'tot_anul' && styles.segmentTextActive]}>Anul 2024</Text>
                    </TouchableOpacity>
                </View>

                {/* KPI Cards */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconWrapper}>
                            <MaterialIcons name="check-circle" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.statValue}>{currentStats.completate}</Text>
                        <Text style={styles.statLabel}>Lucrări Finalizate</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                            <MaterialIcons name="cancel" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.statValue}>{currentStats.anulate}</Text>
                        <Text style={styles.statLabel}>Lucrări Anulate</Text>
                    </View>
                </View>

                {/* Revenue Card */}
                <View style={styles.revenueCard}>
                    <View style={styles.revenueHeader}>
                        <MaterialIcons name="account-balance-wallet" size={24} color="#2563EB" />
                        <Text style={styles.revenueTitle}>Total Încasări</Text>
                    </View>
                    <Text style={styles.revenueValue}>{currentStats.total_incasat.toLocaleString('ro-RO')} RON</Text>

                    <View style={styles.revenueBreakdown}>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Din instalări standard</Text>
                            <Text style={styles.breakdownValue}>{(currentStats.total_incasat * 0.8).toLocaleString('ro-RO')} RON</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Din costuri extra adăugate</Text>
                            <Text style={styles.breakdownValue}>{(currentStats.total_incasat * 0.2).toLocaleString('ro-RO')} RON</Text>
                        </View>
                    </View>

                    {period === 'luna_curenta' && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Progres Estimare Lunară</Text>
                                <Text style={styles.progressLabel}>{currentStats.total_incasat} / {currentStats.estimat}</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${(currentStats.total_incasat / currentStats.estimat) * 100}%` }]} />
                            </View>
                        </View>
                    )}
                </View>

                {/* Detailed Analytics CTA */}
                <TouchableOpacity style={styles.detailedBtn}>
                    <MaterialIcons name="file-download" size={20} color="#4B5563" />
                    <Text style={styles.detailedBtnText}>Descarcă Raport PDF Detaliat</Text>
                </TouchableOpacity>

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
    scrollContent: { padding: 16 },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6
    },
    segmentActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    segmentTextActive: { color: '#111827' },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500'
    },
    revenueCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    revenueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    revenueTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
        marginLeft: 8
    },
    revenueValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2563EB',
        marginBottom: 20
    },
    revenueBreakdown: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
        marginBottom: 16
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    breakdownLabel: { color: '#6B7280', fontSize: 13 },
    breakdownValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
    progressContainer: {
        marginTop: 8
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    progressLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
        borderRadius: 4
    },
    detailedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed'
    },
    detailedBtnText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563'
    }
});
