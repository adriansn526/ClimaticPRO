import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useShop, B2BProduct } from '../../context/ShopContext';

export default function ShopScreen() {
    const { products, cartCount, addToCart } = useShop();
    const [searchQuery, setSearchQuery] = useState('');

    const [isProposeModalVisible, setIsProposeModalVisible] = useState(false);
    const [proposalName, setProposalName] = useState('');
    const [proposalSupplier, setProposalSupplier] = useState('');
    const [proposalPrice, setProposalPrice] = useState('');
    const [proposalLink, setProposalLink] = useState('');
    const [proposalNotes, setProposalNotes] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddToCart = (item: B2BProduct) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addToCart(item);
    };

    const handleProposeSubmit = () => {
        if (!proposalName || !proposalSupplier || !proposalPrice) {
            if (Platform.OS === 'web') alert('Te rugăm să completezi câmpurile obligatorii (Produs, Furnizor, Preț).');
            return;
        }

        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (Platform.OS === 'web') alert('Propunerea a fost trimisă cu succes către administrator!');

        setIsProposeModalVisible(false);
        setProposalName('');
        setProposalSupplier('');
        setProposalPrice('');
        setProposalLink('');
        setProposalNotes('');
    };

    const renderProduct = ({ item }: { item: B2BProduct }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCapacity}>{item.capacity}</Text>

                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.b2bLabel}>Preț instalator (B2B)</Text>
                        <Text style={styles.b2bPrice}>{item.priceB2B} RON</Text>
                    </View>
                    <View style={styles.retailContainer}>
                        <Text style={styles.retailLabel}>Preț client</Text>
                        <Text style={styles.retailPrice}>{item.priceRetail} RON</Text>
                    </View>
                </View>

                <View style={styles.stockRow}>
                    <MaterialIcons name="inventory" size={16} color={item.stock > 0 ? "#10B981" : "#EF4444"} />
                    <Text style={[styles.stockText, { color: item.stock > 0 ? "#10B981" : "#EF4444" }]}>
                        {item.stock > 0 ? `În stoc (${item.stock})` : 'Indisponibil'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <MaterialIcons name="add-shopping-cart" size={20} color="#FFF" />
                    <Text style={styles.addButtonText}>Adaugă în coș</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Magazin B2B</Text>
                    <Text style={styles.headerSubtitle}>Aprovizionare Echipamente</Text>
                </View>
                <TouchableOpacity style={styles.cartBtn}>
                    <MaterialIcons name="shopping-cart" size={28} color="#111827" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#6B7280" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Caută aparate, materiale..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.filterBtn} onPress={() => {
                    if (Platform.OS === 'web') alert('Filtrare în curând...');
                }}>
                    <MaterialIcons name="tune" size={24} color="#2563EB" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.proposeBtn} onPress={() => setIsProposeModalVisible(true)}>
                <MaterialIcons name="lightbulb" size={20} color="#D97706" />
                <Text style={styles.proposeBtnText}>Nu găsești ce cauți? Propune un furnizor</Text>
            </TouchableOpacity>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderProduct}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal Propunere Furnizor/Produs */}
            {isProposeModalVisible && (
                <Modal visible={true} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Propune Furnizor / Produs</Text>
                                <TouchableOpacity onPress={() => setIsProposeModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalScroll}>
                                <Text style={styles.modalSubtitle}>Dacă la furnizorul tău local ai o ofertă mai bună sau ai nevoie de un echipament ce nu este listat, trimite-ne propunerea.</Text>

                                <View style={styles.customExtraForm}>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Nume Echipament / Material (Obligatoriu)"
                                        value={proposalName}
                                        onChangeText={setProposalName}
                                    />
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Nume Furnizor (Obligatoriu)"
                                        value={proposalSupplier}
                                        onChangeText={setProposalSupplier}
                                    />
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Preț Propus - RON (Obligatoriu)"
                                        value={proposalPrice}
                                        onChangeText={setProposalPrice}
                                        keyboardType="numeric"
                                    />
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Link ofertă (Opțional)"
                                        value={proposalLink}
                                        onChangeText={setProposalLink}
                                        autoCapitalize="none"
                                    />
                                    <TextInput
                                        style={[styles.customInput, { height: 80, textAlignVertical: 'top' }]}
                                        placeholder="Observații (Opțional)"
                                        value={proposalNotes}
                                        onChangeText={setProposalNotes}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={[styles.addCustomBtn, (!proposalName || !proposalSupplier || !proposalPrice) && styles.addCustomBtnDisabled]}
                                        onPress={handleProposeSubmit}
                                        disabled={!proposalName || !proposalSupplier || !proposalPrice}
                                    >
                                        <Text style={styles.addCustomBtnText}>Trimite Propunerea</Text>
                                    </TouchableOpacity>
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
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    cartBtn: {
        position: 'relative',
        padding: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 20,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#111827',
    },
    filterBtn: {
        marginLeft: 8,
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
    },
    productImage: {
        width: 120,
        height: '100%',
        backgroundColor: '#F9FAFB',
    },
    productInfo: {
        flex: 1,
        padding: 16,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    productCapacity: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    b2bLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    b2bPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    retailContainer: {
        alignItems: 'flex-end',
    },
    retailLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    retailPrice: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
        textDecorationLine: 'line-through',
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stockText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    addButton: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    },
    proposeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF3C7',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderStyle: 'dashed',
    },
    proposeBtnText: {
        color: '#D97706',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalScroll: {
        maxHeight: '100%',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    customExtraForm: {
        gap: 16,
        paddingBottom: 20,
    },
    customInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    addCustomBtn: {
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    addCustomBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    addCustomBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    }
});
