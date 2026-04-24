import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useJobs, Job } from '../../context/JobContext';

export default function AvailableJobsScreen() {
    const { availableJobs, acceptJob } = useJobs();
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const handleConfirmAccept = () => {
        if (selectedJobId) {
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            acceptJob(selectedJobId);
            setSelectedJobId(null);
        }
    };

    const renderJobCard = ({ item }: { item: Job }) => (
        <View style={styles.card}>
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>Disponibil Acum</Text>
            </View>

            <View style={styles.locationBadge}>
                <MaterialIcons name="location-on" size={14} color="#2563EB" />
                <Text style={styles.regionText}>{item.region}</Text>
            </View>

            <View style={styles.dateBadge}>
                <MaterialIcons name="calendar-today" size={14} color="#D97706" />
                <Text style={styles.dateText}>{item.date || 'În așteptare'}</Text>
            </View>

            <Text style={styles.productText}>Instalare: {item.product}</Text>

            <View style={styles.addressRow}>
                <MaterialIcons name="person" size={16} color="#9CA3AF" />
                <Text style={styles.addressText} numberOfLines={1}>{item.client}</Text>
            </View>
            <View style={styles.addressRow}>
                <MaterialIcons name="map" size={16} color="#9CA3AF" />
                <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
            </View>

            <View style={styles.earningRow}>
                <Text style={styles.earningLabel}>Câștig estimat:</Text>
                <Text style={styles.earningValue}>450 RON</Text>
            </View>

            <TouchableOpacity
                style={styles.acceptButton}
                activeOpacity={0.8}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setSelectedJobId(item.id);
                }}
            >
                <Text style={styles.acceptButtonText}>Acceptă Lucrarea</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {availableJobs.length > 0 ? (
                <FlatList
                    data={availableJobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJobCard}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="inbox" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>Nicio lucrare nouă</Text>
                    <Text style={styles.emptyText}>Nu există lucrări noi disponibile în zona ta momentan. Vei primi o notificare când apare ceva.</Text>
                </View>
            )}

            {/* Custom Bottom Sheet Modal for Accepting */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!selectedJobId}
                onRequestClose={() => setSelectedJobId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="priority-high" size={28} color="#D97706" />
                            </View>
                            <Text style={styles.modalTitle}>Confirmare</Text>
                        </View>
                        <Text style={styles.modalText}>
                            Accepți această lucrare? Odată acceptată, instalarea devine responsabilitatea ta și va apărea în secțiunea 'În Lucru'.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                activeOpacity={0.7}
                                onPress={() => setSelectedJobId(null)}
                            >
                                <Text style={styles.modalCancelText}>Renunță</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalConfirmButton]}
                                activeOpacity={0.8}
                                onPress={handleConfirmAccept}
                            >
                                <Text style={styles.modalConfirmText}>Acceptă</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        padding: 20,
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
    badgeContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#10B981', // Emerald green for available status
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomLeftRadius: 16,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
        marginTop: 8,
    },
    regionText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E3A8A',
        textTransform: 'uppercase',
        marginLeft: 4,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#92400E',
        marginLeft: 4,
    },
    productText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 12,
        lineHeight: 24,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    addressText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8,
        flex: 1,
    },
    earningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    earningLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    earningValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#059669',
    },
    acceptButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 100, // Pill shape
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    acceptButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    modalText: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#F3F4F6',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
    },
    modalConfirmButton: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalConfirmText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    }
});
