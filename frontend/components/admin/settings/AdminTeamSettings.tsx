'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

export default function AdminTeamSettings() {
    const { showToast } = useToast();
    const [members, setMembers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'DISPECER',
        password: '',
        active: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (data.success) {
                setMembers(data.users);
            } else {
                showToast("Nu s-au putut încărca membrii.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Eroare de conexiune.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (member?: AdminUser) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                email: member.email,
                role: member.role,
                active: member.active,
                password: '' // Blank, we only change if they type
            });
        } else {
            setEditingMember(null);
            setFormData({
                name: '',
                email: '',
                role: 'DISPECER',
                password: '',
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let res;
            if (editingMember) {
                res = await fetch(`/api/admin/team/${editingMember.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                res = await fetch('/api/admin/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const data = await res.json();
            if (data.success) {
                showToast(editingMember ? "Membru actualizat cu succes." : "Membru invitat cu succes.", "success");
                setIsModalOpen(false);
                fetchMembers();
            } else {
                showToast(data.message || data.error || "A apărut o eroare.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Eroare de conexiune la server.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Ești sigur că dorești să ștergi definitiv contul pentru ${name}? Acestă acțiune este ireversibilă.`)) return;
        
        try {
            const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast("Membru șters definitiv.", "success");
                fetchMembers();
            } else {
                showToast(data.error || "Eroare la ștergere.", "error");
            }
        } catch (e) {
            showToast("Eroare severă de rețea.", "error");
        }
    };

    const getRoleBadge = (role: string) => {
        const roles: any = {
            'SUPER_ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
            'DISPECER': 'bg-blue-100 text-blue-800 border-blue-200',
            'CONTABIL': 'bg-green-100 text-green-800 border-green-200',
            'MARKETING': 'bg-orange-100 text-orange-800 border-orange-200',
        };
        const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200';
        return roles[role] || defaultStyle;
    };

    return (
        <div className="mt-12 bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        Gestiune Echipă (Staff Admin)
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Acordă acces altor colegi pentru a acționa în panoul de administrare.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Adaugă Membru
                </button>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Se încarcă lista membrilor...</div>
                ) : members.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Niciun membru adăugat încă.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 pl-8 font-medium">Nume Membru</th>
                                <th className="p-4 font-medium">Email (Login)</th>
                                <th className="p-4 font-medium">Rol Acces</th>
                                <th className="p-4 font-medium text-center">Status</th>
                                <th className="p-4 pr-8 font-medium text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 pl-8">
                                        <div className="font-semibold text-gray-900">{member.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Adăugat: {new Date(member.createdAt).toLocaleDateString('ro-RO')}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadge(member.role)}`}>
                                            <Shield className="w-3 h-3 inline-block mr-1 mb-0.5" />
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {member.active ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Activ
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                <XCircle className="w-3.5 h-3.5" /> Suspendat
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 pr-8 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(member)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Editează cont"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(member.id, member.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Șterge definitiv"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Adăugare / Editare Membru */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                {editingMember ? 'Editare Membru Echipă' : 'Invită Membru Echipă'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nume Complet</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Nume Prenume"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cont Login)</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="admin@domeniu.ro"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Acces</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="SUPER_ADMIN">Super Administrator</option>
                                        <option value="DISPECER">Dispecer (Comenzi/Scraper)</option>
                                        <option value="CONTABIL">Contabil (Facturi)</option>
                                        <option value="MARKETING">Marketing (Bannere)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Cont</label>
                                    <select
                                        value={formData.active ? 'true' : 'false'}
                                        onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="true">Activ</option>
                                        <option value="false">Suspendat</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingMember ? 'Schimbă Parola (opțional)' : 'Parolă de Acces (pe care i-o comunici)'}
                                </label>
                                <input
                                    type="text"
                                    required={!editingMember}
                                    placeholder={editingMember ? "Lasă gol pentru a nu schimba" : "Introdu parola pentru coleg..."}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                {!editingMember && <p className="text-xs text-gray-500 mt-1">Va trebui să-i transmiți această parolă generată prin alte medii (ex: Whatsapp), pentru ca platforma să blindeze securitatea la login.</p>}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Anulează
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Se salvează...' : (editingMember ? 'Salvează Modificări' : 'Creează Cont')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
