import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fetchWithAuth } from '../utils/api';

type TeamMember = {
    id: string;
    installerId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
};

export default function TeamScreen() {
    const router = useRouter();
    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'tehnician' | 'montator'>('tehnician');

    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Fetch user details for the top card (the logged-in admin)
    const [adminUser, setAdminUser] = useState<any>(null);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        setLoading(true);
        try {
            // Get current user details from local storage
            let userDataStr = null;
            if (Platform.OS === 'web') {
                userDataStr = localStorage.getItem('userData');
            } else {
                const SecureStore = await import('expo-secure-store');
                userDataStr = await SecureStore.getItemAsync('userData');
            }

            if (userDataStr) {
                try {
                    setAdminUser(JSON.parse(userDataStr));
                } catch (e) { }
            }

            const res = await fetchWithAuth('/mobile/team');
            if (res.success && res.team) {
                // Parse IDs correctly from DB
                const fetchedTeam = res.team.map((t: any) => ({
                    ...t,
                    id: t.id.toString()
                }));
                setTeam(fetchedTeam);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleSendInvite = async () => {
        if (!inviteEmail) {
            if (Platform.OS === 'web') alert("Introdu o adresă de email validă.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetchWithAuth('/mobile/team', {
                method: 'POST',
                body: JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteName })
            });

            if (res.success && res.member) {
                const newMember = { ...res.member, id: res.member.id.toString() };
                setTeam([...team, newMember]);
                setIsInviteModalVisible(false);
                setInviteEmail('');
                setInviteName('');
                setInviteRole('tehnician');

                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (Platform.OS === 'web') alert("Invitația a fost trimisă cu succes!");
            } else {
                if (Platform.OS === 'web') alert(res.message || "Eroare la trimiterea invitației.");
                else Alert.alert("Eroare", res.message || "Eroare la trimiterea invitației.");
            }
        } catch (error) {
            console.error(error);
            if (Platform.OS === 'web') alert("Eroare de rețea.");
            else Alert.alert("Eroare", "A apărut o problemă de conexiune.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmRemove = (member: TeamMember) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Sigur dorești să elimini accesul lui ${member.name}?`)) {
                handleRemove(member.id);
            }
        } else {
            Alert.alert(
                "Eliminare Colaborator",
                `Sigur dorești să elimini accesul lui ${member.name}?`,
                [
                    { text: "Renunță", style: "cancel" },
                    { text: "Elimină", style: "destructive", onPress: () => handleRemove(member.id) }
                ]
            );
        }
    };

    const handleRemove = async (id: string) => {
        try {
            const res = await fetchWithAuth(`/mobile/team/${id}`, { method: 'DELETE' });
            if (res.success) {
                setTeam(prev => prev.filter(m => m.id !== id));
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                if (Platform.OS === 'web') alert(res.message || "Eroare la eliminare.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'tehnician': return 'Tehnician Principal';
            case 'montator': return 'Ajutor Montaj';
            default: return role;
        }
    };

    const getRolePermissions = (role: string) => {
        switch (role) {
            case 'admin': return 'Acces complet (Rapoarte, Finanțe, Lucrări)';
            case 'tehnician': return 'Acces Lucrări, Generare PV, Costuri Extra';
            case 'montator': return 'Vizualizare Lucrări, Încărcare Poze';
            default: return '';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Echipa Mea</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <MaterialIcons name="groups" size={40} color="#2563EB" />
                    <Text style={styles.summaryTitle}>Membri Echipă</Text>
                    <Text style={styles.summaryDesc}>Invită colegi pentru a participa la instalări sau pentru a avea acces la dispecerat. Definiți permisiunile fiecăruia.</Text>
                </View>

                {/* Always render current admin user here as the "Eu (Tu)" reference */}
                {adminUser && (
                    <View style={styles.memberCard}>
                        <View style={styles.memberHeader}>
                            <View style={[styles.avatar, { backgroundColor: '#2563EB' }]}>
                                <Text style={[styles.avatarText, { color: '#FFF' }]}>
                                    {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : (adminUser.email ? adminUser.email.charAt(0).toUpperCase() : 'U')}
                                </Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{adminUser.name || adminUser.companyName || 'Instalator Principal'} (Tu)</Text>
                                <Text style={styles.memberEmail}>{adminUser.email}</Text>
                            </View>
                            <View style={[styles.statusBadge, styles.statusActive]}>
                                <Text style={[styles.statusText, styles.statusTextActive]}>Activ</Text>
                            </View>
                        </View>

                        <View style={styles.roleContainer}>
                            <MaterialIcons name="security" size={16} color="#6B7280" />
                            <Text style={styles.roleLabel}>{getRoleLabel('admin')}</Text>
                        </View>
                        <Text style={styles.permissionsDesc}>{getRolePermissions('admin')}</Text>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
                ) : (
                    team.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberEmail}>{member.email}</Text>
                                </View>
                                <View style={[styles.statusBadge, member.status === 'pending' ? styles.statusPending : styles.statusActive]}>
                                    <Text style={[styles.statusText, member.status === 'pending' ? styles.statusTextPending : styles.statusTextActive]}>
                                        {member.status === 'pending' ? 'În așteptare' : 'Activ'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.roleContainer}>
                                <MaterialIcons name="security" size={16} color="#6B7280" />
                                <Text style={styles.roleLabel}>{getRoleLabel(member.role)}</Text>
                            </View>
                            <Text style={styles.permissionsDesc}>{getRolePermissions(member.role)}</Text>

                            {member.role !== 'admin' && (
                                <TouchableOpacity style={styles.removeBtn} onPress={() => confirmRemove(member)}>
                                    <Text style={styles.removeBtnText}>Elimină accesul</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}

                <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsInviteModalVisible(true);
                    }}
                >
                    <MaterialIcons name="person-add" size={24} color="#FFF" />
                    <Text style={styles.inviteBtnText}>Invită un Membru Nou</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* INVITE MODAL */}
            {isInviteModalVisible && (
                <Modal visible={true} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Invită Coleg</Text>
                                <TouchableOpacity onPress={() => setIsInviteModalVisible(false)} disabled={submitting}>
                                    <MaterialIcons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Nume Coleg (Opțional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ex. Andrei V."
                                value={inviteName}
                                onChangeText={setInviteName}
                            />

                            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Adresă de Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="nume@climaticpro.ro"
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Nivel de Acces (Rol)</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleOption, inviteRole === 'admin' && styles.roleOptionActive]}
                                    onPress={() => setInviteRole('admin')}
                                >
                                    <Text style={[styles.roleOptionText, inviteRole === 'admin' && styles.roleOptionTextActive]}>Administrator</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, inviteRole === 'tehnician' && styles.roleOptionActive]}
                                    onPress={() => setInviteRole('tehnician')}
                                >
                                    <Text style={[styles.roleOptionText, inviteRole === 'tehnician' && styles.roleOptionTextActive]}>Tehnician Principal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, inviteRole === 'montator' && styles.roleOptionActive]}
                                    onPress={() => setInviteRole('montator')}
                                >
                                    <Text style={[styles.roleOptionText, inviteRole === 'montator' && styles.roleOptionTextActive]}>Ajutor Montaj</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.roleHint}>{getRolePermissions(inviteRole)}</Text>

                            <TouchableOpacity
                                style={[styles.sendInviteBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleSendInvite}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.sendInviteBtnText}>Trimite Invitația</Text>
                                )}
                            </TouchableOpacity>
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
    scrollContent: { padding: 16, paddingBottom: 40 },
    summaryCard: {
        backgroundColor: '#DBEAFE',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E3A8A',
        marginTop: 12,
        marginBottom: 8,
    },
    summaryDesc: {
        textAlign: 'center',
        color: '#1E40AF',
        lineHeight: 20,
    },
    memberCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4B5563',
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    memberEmail: { fontSize: 13, color: '#6B7280' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: { backgroundColor: '#DCFCE7' },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusText: { fontSize: 11, fontWeight: '700' },
    statusTextActive: { color: '#16A34A' },
    statusTextPending: { color: '#D97706' },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 6,
    },
    permissionsDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
    },
    removeBtn: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        alignItems: 'center',
    },
    removeBtnText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    inviteBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    inviteBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
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
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#111827',
    },
    roleSelector: {
        flexDirection: 'column',
        gap: 8,
        marginTop: 8,
    },
    roleOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    roleOptionActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    roleOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    roleOptionTextActive: {
        color: '#2563EB',
    },
    roleHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 12,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    sendInviteBtn: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    sendInviteBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
