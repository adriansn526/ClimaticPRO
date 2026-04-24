import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useJobs, Job } from '../../context/JobContext';

export default function ActiveJobsScreen() {
    const router = useRouter();
    const { activeJobs } = useJobs();

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Programat', bg: '#DBEAFE', text: '#1E40AF' };
            case 'in_progress': return { label: 'În Lucru', bg: '#FEF3C7', text: '#92400E' };
            case 'completed': return { label: 'Finalizat', bg: '#D1FAE5', text: '#065F46' };
            default: return { label: 'Necunoscut', bg: '#F3F4F6', text: '#374151' };
        }
    };

    const renderJobCard = ({ item }: { item: Job }) => {
        const badge = getStatusBadge(item.status || 'pending');

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.timeContainer}>
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text style={styles.timeText}>{item.date}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.clientRow}>
                    <Text style={styles.clientName}>{item.client}</Text>
                    <TouchableOpacity
                        style={styles.callButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (item.phone) handleCall(item.phone);
                        }}
                    >
                        <MaterialIcons name="call" size={20} color="#16A34A" />
                    </TouchableOpacity>
                </View>

                <View style={styles.addressRow}>
                    <MaterialIcons name="location-pin" size={16} color="#6B7280" style={{ marginTop: 2 }} />
                    <Text style={styles.addressText}>{item.address}</Text>
                </View>

                <View style={styles.productsContainer}>
                    <Text style={styles.productsLabel}>DE INSTALAT:</Text>
                    {item.products?.map((prod: string, idx: number) => (
                        <View key={idx} style={styles.productRow}>
                            <MaterialIcons name="check-box" size={14} color="#2563EB" />
                            <Text style={styles.productItem}>{prod}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.detailsButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/job/${item.id}`);
                    }}
                >
                    <Text style={styles.detailsButtonText}>Deschide Lucrarea</Text>
                    <MaterialIcons name="arrow-forward-ios" size={14} color="#2563EB" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {activeJobs.length > 0 ? (
                <FlatList
                    data={activeJobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJobCard}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <FontAwesome5 name="tools" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>Nicio lucrare activă</Text>
                    <Text style={styles.emptyText}>Când accepți o lucrare din lista de disponibile, ea va apărea aici.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // Extra padding for the absolute tab bar
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginLeft: 6,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        marginBottom: 12,
    },
    clientName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addressRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    addressText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    productsContainer: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    productsLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 6,
    },
    productItem: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    detailsButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    detailsButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2563EB',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 20,
    }
});
