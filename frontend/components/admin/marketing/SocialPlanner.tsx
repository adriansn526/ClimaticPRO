'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Video, LayoutTemplate, Share2, Facebook, Instagram, Linkedin, Star, AlignLeft, X } from 'lucide-react';
import SocialComposer from './SocialComposer';

interface SocialPost {
    id: number;
    text: string | null;
    mediaUrl: string | null;
    mediaType: string;
    scheduledDate: string;
    scheduledTime: string;
    platforms: string[];
    status: string;
}

interface SocialAccount {
    id: number;
    platform: string;
    accountName: string | null;
}

export default function SocialPlanner() {
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [postToEdit, setPostToEdit] = useState<SocialPost | null>(null);
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/social/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/social/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await Promise.all([fetchPosts(), fetchAccounts()]);
            setIsLoading(false);
        };
        loadInitialData();

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'FB_OAUTH') {
                if (event.data.status === 'facebook_connected') {
                    fetchAccounts(); // Refresh the connection list
                } else if (event.data.status === 'no_facebook_pages_found') {
                } else if (event.data.status === 'tiktok_connected') {
                    fetchAccounts();
                } else if (event.data.status === 'tiktok_denied') {
                    alert('Conectarea cu TikTok a fost refuzată sau anulată.');
                } else {
                    alert('Eroare conexiune Facebook/TikTok: ' + event.data.status);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleFacebookConnect = () => {
        const width = 600;
        const height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        window.open('/api/auth/facebook/login', 'FacebookAuth', `width=${width},height=${height},left=${left},top=${top}`);
    };

    const handleTikTokConnect = () => {
        const width = 500;
        const height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        window.open('/api/auth/tiktok/login', 'TikTokAuth', `width=${width},height=${height},left=${left},top=${top}`);
    };

    // Get current month's basic days structure (simplified for demo)
    const today = new Date();
    const currentMonth = today.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });
    const daysInMonth = 31; // Mock for now, usually dynamically calculated
    const firstDay = 2; // Mock start day offset

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const dateStr = `2026-03-${d.toString().padStart(2, '0')}`;
        const dayPosts = posts.filter(p => {
            if (!p.scheduledDate) return false;
            // API returns ISO strings like 2026-03-09T00:00:00.000Z
            const apiDateStr = p.scheduledDate.split('T')[0];
            return apiDateStr === dateStr;
        });
        return { day: d, dateStr, posts: dayPosts };
    });

    const openComposer = (dateStr?: string, post?: SocialPost) => {
        if (post) {
            setPostToEdit(post);
            const apiDateStr = post.scheduledDate.split('T')[0];
            setSelectedDate(new Date(apiDateStr));
        } else {
            setPostToEdit(null);
            if (dateStr) setSelectedDate(new Date(dateStr));
            else setSelectedDate(new Date());
        }
        setIsComposerOpen(true);
    };

    const handleDeletePost = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent opening the composer
        if (!window.confirm('Ești sigur că vrei să ștergi această postare planificată?')) return;

        try {
            const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPosts();
            } else {
                alert('Eroare la ștergerea postării.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Eroare conexiune.');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        Calendar Conținut Social Media
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Planifică, generează și publică automat postări pe platformele conectate.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => alert("Curând: Funcția AI Assistant va popula calendarul folosind reguli predefinite.")}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-blue-200"
                    >
                        ✨ Generator AI (Autopilot)
                    </button>
                    <button
                        onClick={() => openComposer()}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Postare Nouă
                    </button>
                </div>
            </div>

            {/* Integrations Bar */}
            <div className="bg-gray-50 flex border-b border-gray-200 overflow-x-auto no-scrollbar items-center px-6 gap-4 py-4">

                {/* Facebook Integration */}
                {accounts.find(a => a.platform === 'facebook') ? (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm shrink-0">
                        <Facebook className="w-5 h-5 text-[#1877F2]" />
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-bold uppercase leading-none mb-1">Facebook Configurat</span>
                            <span className="text-sm font-bold text-green-600 leading-none truncate max-w-[120px]" title={accounts.find(a => a.platform === 'facebook')?.accountName || 'Pagină'}>
                                {accounts.find(a => a.platform === 'facebook')?.accountName || 'Pagină activă'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-gray-100/50 px-4 py-2 rounded-lg border border-dashed border-gray-300 group hover:border-[#1877F2] transition-colors shrink-0">
                        <Facebook className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity group-hover:text-[#1877F2]" />
                        <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-500 font-bold uppercase leading-none mb-1">Facebook</span>
                            <span className="text-sm font-bold text-gray-600 leading-none">Deconectat</span>
                        </div>
                        <button onClick={handleFacebookConnect} className="ml-4 flex-shrink-0 text-xs bg-[#1877F2] text-white px-4 py-1.5 rounded-md hover:bg-[#145CBDF] font-bold shadow-sm transition-transform active:scale-95 text-center">
                            Conectează
                        </button>
                    </div>
                )}

                {/* TikTok Integration */}
                {accounts.find(a => a.platform === 'tiktok') ? (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm shrink-0">
                        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-bold uppercase leading-none mb-1">TikTok Configurat</span>
                            <span className="text-sm font-bold text-green-600 leading-none truncate max-w-[120px]" title={accounts.find(a => a.platform === 'tiktok')?.accountName || 'Cont TikTok'}>
                                {accounts.find(a => a.platform === 'tiktok')?.accountName || 'Cont TikTok'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-gray-100/50 px-4 py-2 rounded-lg border border-dashed border-gray-300 group hover:border-black transition-colors shrink-0">
                        <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity group-hover:text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-500 font-bold uppercase leading-none mb-1">TikTok API</span>
                            <span className="text-sm font-bold text-gray-600 leading-none">Deconectat</span>
                        </div>
                        <button onClick={handleTikTokConnect} className="ml-4 flex-shrink-0 text-xs bg-black text-white px-4 py-1.5 rounded-md hover:bg-gray-800 font-bold shadow-sm transition-transform active:scale-95 text-center">
                            Conectează
                        </button>
                    </div>
                )}

                {/* LinkedIn Fake Integration */}
                <div className="flex items-center gap-3 bg-gray-100/50 px-4 py-2 rounded-lg border border-dashed border-gray-300 group hover:border-[#0A66C2] transition-colors shrink-0">
                    <Linkedin className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity group-hover:text-[#0A66C2]" />
                    <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-500 font-bold uppercase leading-none mb-1">LinkedIn API</span>
                        <span className="text-sm font-bold text-gray-600 leading-none">În curând</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg capitalize">{currentMonth}</h4>
                    <div className="flex gap-2 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 rounded-full inline-block"></span> Imagine</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 rounded-full inline-block"></span> Video</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded-full inline-block"></span> Text</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
                    {/* Days Header */}
                    {['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'].map(day => (
                        <div key={day} className="bg-gray-100 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50 min-h-[120px]"></div>
                    ))}

                    {/* Actual Days */}
                    {days.map((dayData, idx) => (
                        <div key={idx} className="bg-white min-h-[120px] p-2 hover:bg-gray-50 transition-colors group relative border-r border-b border-gray-100">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{dayData.day}</span>
                                <button
                                    onClick={() => openComposer(dayData.dateStr)}
                                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-2 space-y-1">
                                {dayData.posts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => openComposer(undefined, post)}
                                        className={`text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow relative group/post ${post.mediaType === 'video' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                            post.mediaType === 'image' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        <div className="font-bold truncate pr-4">{post.text || 'Postare Media'}</div>
                                        <div className="flex gap-1 mt-1 opacity-70">
                                            {post.platforms.includes('facebook') && <Facebook className="w-3 h-3" />}
                                            {post.platforms.includes('instagram') && <Instagram className="w-3 h-3" />}
                                            {post.platforms.includes('linkedin') && <Linkedin className="w-3 h-3" />}
                                            {post.platforms.includes('tiktok') && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePost(post.id, e)}
                                            className="absolute top-1 right-1 opacity-0 group-hover/post:opacity-100 bg-red-100 hover:bg-red-200 text-red-600 rounded p-0.5 transition-opacity"
                                            title="Șterge postarea"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Composer Modal */}
            {isComposerOpen && (
                <SocialComposer
                    onClose={() => {
                        setIsComposerOpen(false);
                        setPostToEdit(null);
                        fetchPosts(); // Refresh posts after creating a new one
                    }}
                    initialDate={selectedDate || new Date()}
                    postToEdit={postToEdit}
                />
            )}
        </div>
    );
}
