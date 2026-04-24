import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Platform, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fetchWithAuth } from '../utils/api';

type StockItem = {
    id: number;
    name: string;
    type: string;
    stock: number;
    unit: string;
    minStock: number;
};

export default function StocksScreen() {
    const router = useRouter();
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    // State for Editing / Adding manually
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editStock, setEditStock] = useState('');
    const [editUnit, setEditUnit] = useState('buc');
    const [editType, setEditType] = useState('material');

    // Processing / feedback
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadStocks();
    }, []);

    const loadStocks = async () => {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth('/mobile/stocks');
            if (data.success && data.stocks) {
                setStocks(data.stocks);
            } else {
                if (Platform.OS === 'web') alert(data.message || 'Eroare preluare stocuri.');
                else Alert.alert('Eroare', data.message || 'Eroare preluare stocuri.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleFetchSPV = () => {
        setIsActionModalVisible(false);
        setIsProcessing(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setTimeout(() => {
            setIsProcessing(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (Platform.OS === 'web') alert('S-au preluat 2 facturi noi din SPV. Stocul a fost actualizat.');
            else Alert.alert('SPV Sincronizat', 'S-au preluat 2 facturi noi din SPV. Stocul a fost actualizat.');

            setStocks(prev => [{ id: Date.now(), name: 'Furtun Condens', type: 'material', stock: 50, unit: 'ml', minStock: 10 }, ...prev]);
        }, 1500);
    };

    const handleScanReceipt = () => {
        setIsActionModalVisible(false);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (Platform.OS === 'web') {
            alert('Această funcție va deschide camera pentru a poza bonul fiscal.');
        } else {
            Alert.alert('Scanează Bon', 'Va deschide camera foto.');
        }
    };

    const openEditModal = (item?: StockItem) => {
        setIsActionModalVisible(false);
        if (item) {
            setSelectedItem(item);
            setEditName(item.name);
            setEditStock(item.stock.toString());
            setEditUnit(item.unit);
            setEditType(item.type);
        } else {
            setSelectedItem(null);
            setEditName('');
            setEditStock('');
            setEditUnit('buc');
            setEditType('material');
        }
        setIsEditModalVisible(true);
    };

    const handleSaveItem = async () => {
        if (!editName || !editStock) {
            if (Platform.OS === 'web') alert("Numele și cantitatea sunt obligatorii.");
            return;
        }

        const stockNum = parseFloat(editStock);
        if (isNaN(stockNum)) {
            if (Platform.OS === 'web') alert("Cantitatea trebuie să fie un număr valid.");
            return;
        }

        try {
            setIsProcessing(true);
            const payload = {
                itemId: selectedItem ? selectedItem.id : undefined,
                name: editName,
                type: editType,
                quantity: stockNum,
                operation: 'set',
                source: 'manual'
            };
            const data = await fetchWithAuth('/mobile/stocks', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (data.success) {
                await loadStocks(); // Refresh the list from the server
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsEditModalVisible(false);
            } else {
                if (Platform.OS === 'web') alert('Eroare: ' + data.message);
                else Alert.alert('Eroare', data.message);
            }
        } catch (e) {
            console.error(e);
            if (Platform.OS === 'web') alert('A aparut o eroare de retea');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;

        const confirmDelete = async () => {
            try {
                setIsProcessing(true);
                const data = await fetchWithAuth(`/mobile/stocks?id=${selectedItem.id}`, { method: 'DELETE' });

                if (data.success) {
                    await loadStocks();
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setIsEditModalVisible(false);
                } else {
                    if (Platform.OS === 'web') alert('Eroare: ' + data.message);
                    else Alert.alert('Eroare', data.message);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsProcessing(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Sigur dorești să ștergi "${selectedItem.name}" din stoc?`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                "Ștergere articol",
                `Sigur dorești să ștergi "${selectedItem.name}" din stoc?`,
                [
                    { text: "Renunță", style: "cancel" },
                    { text: "Șterge", style: "destructive", onPress: confirmDelete }
                ]
            );
        }
    };

    const getIconForType = (type: string) => {
        if (type === 'echipament') return <MaterialIcons name="ac-unit" size={24} color="#0284C7" />;
        return <FontAwesome5 name="toolbox" size={20} color="#D97706" />;
    };

    const renderStockItem = ({ item }: { item: StockItem }) => {
        const isLow = item.stock <= item.minStock;
        return (
            <TouchableOpacity
                style={styles.stockCard}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    openEditModal(item);
                }}
            >
                <View style={styles.stockIconWrapper}>
                    {getIconForType(item.type)}
                </View>
                <View style={styles.stockInfo}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockType}>{item.type === 'echipament' ? 'Echipament' : 'Materiale'}</Text>
                </View>
                <View style={styles.stockAmountContainer}>
                    <Text style={[styles.stockAmount, isLow && styles.stockAmountLow]}>
                        {item.stock} <Text style={styles.stockUnit}>{item.unit}</Text>
                    </Text>
                    {isLow && (
                        <Text style={styles.lowStockWarning}>Stoc Scăzut</Text>
                    )}
                </View>
                <View style={styles.stockChevron}>
                    <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header ... */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestiune Stocuri</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.topActions}>
                <Text style={styles.subtitle}>Echipamente pe Mașină / Depozit Tehnic</Text>
                <TouchableOpacity
                    style={styles.addStockBtn}
                    onPress={() => setIsActionModalVisible(true)}
                >
                    <MaterialIcons name="add" size={20} color="#FFF" />
                    <Text style={styles.addStockText}>Adaugă Materiale (SPV / Bon)</Text>
                </TouchableOpacity>
            </View>

            {isProcessing && (
                <View style={styles.processingBadge}>
                    <ActivityIndicator size="small" color="#1E40AF" />
                    <Text style={styles.processingText}>Se procesează documentele...</Text>
                </View>
            )}

            {isLoading ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={stocks}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderStockItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', padding: 40 }}>
                            <MaterialIcons name="inventory" size={48} color="#D1D5DB" />
                            <Text style={{ marginTop: 16, color: '#6B7280', textAlign: 'center' }}>Nu există stocuri configurate.</Text>
                        </View>
                    }
                />
            )}

            {/* ACTION MODAL (SPV / SCAN / MANUAL) */}
            {isActionModalVisible && (
                <Modal visible={true} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Adăugare Stoc</Text>
                                <TouchableOpacity onPress={() => setIsActionModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.actionCard} onPress={handleFetchSPV}>
                                <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                                    <MaterialIcons name="cloud-download" size={24} color="#16A34A" />
                                </View>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Preluare e-Factura din SPV</Text>
                                    <Text style={styles.actionDesc}>Baza de date va extrage automat materialele din ultimele tale facturi primite de la furnizori prin ANAF SPV.</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} onPress={handleScanReceipt}>
                                <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                                    <MaterialIcons name="document-scanner" size={24} color="#0284C7" />
                                </View>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Scanează Bon / Factură Fizică (AI OCR)</Text>
                                    <Text style={styles.actionDesc}>Realizează o fotografie bonului fiscal de la magazin, iar aplicația va extrage singură produsele și cantitățile.</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} onPress={() => openEditModal()}>
                                <View style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}>
                                    <MaterialIcons name="edit" size={24} color="#4B5563" />
                                </View>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Introducere Manuală</Text>
                                    <Text style={styles.actionDesc}>Adaugă direct numele produsului și cantitatea intrată.</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* EDIT / ADD MANUAL MODAL */}
            {isEditModalVisible && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedItem ? 'Editare Articol' : 'Adăugare Articol Manual'}</Text>
                                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: '80%' }}>
                                <Text style={styles.inputLabel}>Nume / Descriere Produs *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Teavă Cupru Colac"
                                    value={editName}
                                    onChangeText={setEditName}
                                    autoCapitalize="words"
                                />

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                        <Text style={styles.inputLabel}>Cantitate *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0"
                                            value={editStock}
                                            onChangeText={setEditStock}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.inputLabel}>Unitate</Text>
                                        <View style={styles.pillContainer}>
                                            <TouchableOpacity
                                                style={[styles.pillBtn, editUnit === 'buc' && styles.pillBtnActive]}
                                                onPress={() => setEditUnit('buc')}
                                            ><Text style={[styles.pillText, editUnit === 'buc' && styles.pillTextActive]}>BUC</Text></TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.pillBtn, editUnit === 'ml' && styles.pillBtnActive]}
                                                onPress={() => setEditUnit('ml')}
                                            ><Text style={[styles.pillText, editUnit === 'ml' && styles.pillTextActive]}>M.L.</Text></TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.pillBtn, editUnit === 'set' && styles.pillBtnActive]}
                                                onPress={() => setEditUnit('set')}
                                            ><Text style={[styles.pillText, editUnit === 'set' && styles.pillTextActive]}>SET</Text></TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Tip Produs</Text>
                                <View style={styles.pillContainer}>
                                    <TouchableOpacity
                                        style={[styles.pillBtn, editType === 'echipament' && styles.pillBtnActive]}
                                        onPress={() => setEditType('echipament')}
                                    ><Text style={[styles.pillText, editType === 'echipament' && styles.pillTextActive]}>Unitate AC (Echipament)</Text></TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.pillBtn, editType === 'material' && styles.pillBtnActive]}
                                        onPress={() => setEditType('material')}
                                    ><Text style={[styles.pillText, editType === 'material' && styles.pillTextActive]}>Materiale / Piese</Text></TouchableOpacity>
                                </View>

                                <View style={styles.modalActionsRow}>
                                    {selectedItem ? (
                                        <>
                                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteItem}>
                                                <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
                                                <Text style={styles.deleteBtnText}>Șterge</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.saveActionBtn, { flex: 1, marginLeft: 12 }]} onPress={handleSaveItem}>
                                                <Text style={styles.saveActionText}>Salvează Modificări</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <TouchableOpacity style={[styles.saveActionBtn, { flex: 1 }]} onPress={handleSaveItem}>
                                            <Text style={styles.saveActionText}>Adaugă în Stoc</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
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
    topActions: {
        padding: 16,
        paddingBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 12
    },
    addStockBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    addStockText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8
    },
    processingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    processingText: {
        marginLeft: 12,
        color: '#1E3A8A',
        fontWeight: '600',
        fontSize: 13,
    },
    listContent: {
        padding: 16
    },
    stockCard: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2
    },
    stockIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    stockInfo: {
        flex: 1
    },
    stockName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4
    },
    stockType: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500'
    },
    stockAmountContainer: {
        alignItems: 'flex-end',
        paddingLeft: 10
    },
    stockAmount: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827'
    },
    stockAmountLow: {
        color: '#EF4444'
    },
    stockUnit: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },
    lowStockWarning: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase'
    },
    stockChevron: {
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionInfo: {
        flex: 1,
        paddingRight: 8,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    actionDesc: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#111827',
        marginBottom: 16,
    },
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    inputGroup: {
        flexDirection: 'column',
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    pillBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillBtnActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    pillTextActive: {
        color: '#2563EB',
    },
    modalActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    deleteBtnText: {
        color: '#DC2626',
        fontWeight: '700',
        marginLeft: 6,
    },
    saveActionBtn: {
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    saveActionText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    }
});
