'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, Sparkles, Send, Facebook, Instagram, Linkedin, MessageCircle, MapPin, Heart, Bookmark, Music, Share2 } from 'lucide-react';

interface Props {
    onClose: () => void;
    initialDate?: Date;
    postToEdit?: any;
}

export default function SocialComposer({ onClose, initialDate, postToEdit }: Props) {
    const [platforms, setPlatforms] = useState({
        facebook: postToEdit ? postToEdit.platforms.includes('facebook') : true,
        instagram: postToEdit ? postToEdit.platforms.includes('instagram') : true,
        linkedin: postToEdit ? postToEdit.platforms.includes('linkedin') : false,
        google: false,
        tiktok: postToEdit ? postToEdit.platforms.includes('tiktok') : false
    });

    const [text, setText] = useState(postToEdit?.text || '');
    const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>(postToEdit?.mediaType || 'none');
    const [activePreview, setActivePreview] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');

    // Handle the date conversion correctly
    let initDate = new Date().toISOString().split('T')[0];
    if (postToEdit?.scheduledDate) {
        initDate = postToEdit.scheduledDate.split('T')[0];
    } else if (initialDate) {
        initDate = initialDate.toISOString().split('T')[0];
    }

    const [scheduleDate, setScheduleDate] = useState(initDate);
    const [scheduleTime, setScheduleTime] = useState(postToEdit?.scheduledTime || '12:00');
    const [isScheduling, setIsScheduling] = useState(false);
    const [publishNow, setPublishNow] = useState(false);

    const handleSchedule = async () => {
        if (!text && mediaType === 'none') {
            alert('Adaugă text sau media (imagine/video) pentru postare.');
            return;
        }

        const selectedPlatforms = Object.keys(platforms).filter((key) => platforms[key as keyof typeof platforms]);
        if (selectedPlatforms.length === 0) {
            alert('Selectează cel puțin o platformă socială.');
            return;
        }

        if (platforms.tiktok && mediaType !== 'video') {
            alert('TikTok permite doar postări de tip Video. Te rog să atașezi un video sau să debifezi TikTok.');
            return;
        }

        setIsScheduling(true);
        try {
            const url = postToEdit ? `/api/social/posts/${postToEdit.id}` : '/api/social/posts';
            const method = postToEdit ? 'PUT' : 'POST';

            const payload: any = {
                text,
                mediaType,
                mediaUrl: postToEdit?.mediaUrl || null,
                platforms: selectedPlatforms
            };

            if (publishNow) {
                payload.publishNow = true;
            } else {
                payload.scheduledDate = scheduleDate;
                payload.scheduledTime = scheduleTime;
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onClose();
            } else {
                const data = await res.json();
                alert(`Eroare la planificare: ${data.error || 'Server error'}`);
            }
        } catch (error) {
            console.error("Schedule error:", error);
            alert('A apărut o eroare la conexiunea cu serverul.');
        } finally {
            setIsScheduling(false);
        }
    };

    // Mocks for UI interaction
    const isAiGenerating = false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden">

                {/* LEFT PANEL: Composer Form */}
                <div className="w-1/2 flex flex-col border-r border-gray-200 bg-gray-50/50">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            Compozitor Postări
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Platform Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Distribuie pe:</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setPlatforms({ ...platforms, facebook: !platforms.facebook })} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${platforms.facebook ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <Facebook className="w-4 h-4" /> Facebook
                                </button>
                                <button onClick={() => setPlatforms({ ...platforms, instagram: !platforms.instagram })} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${platforms.instagram ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <Instagram className="w-4 h-4" /> Instagram
                                </button>
                                <button onClick={() => setPlatforms({ ...platforms, linkedin: !platforms.linkedin })} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${platforms.linkedin ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                </button>
                                <button onClick={() => setPlatforms({ ...platforms, tiktok: !platforms.tiktok })} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${platforms.tiktok ? 'bg-gray-900 border-black text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg> TikTok
                                </button>
                            </div>
                        </div>

                        {/* Media Upload / Generation */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Media (Atașamente)</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMediaType('image')}
                                    className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${mediaType === 'image' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-500'}`}
                                >
                                    <ImageIcon className="w-8 h-8 opacity-70" />
                                    <span className="font-bold text-sm">Încarcă Imagini</span>
                                </button>

                                <button
                                    onClick={() => setMediaType('video')}
                                    className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${mediaType === 'video' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 text-gray-500'}`}
                                >
                                    <Video className="w-8 h-8 opacity-70" />
                                    <span className="font-bold text-sm">Generare Video AI</span>
                                    <span className="text-[10px] uppercase font-bold bg-purple-100 px-2 py-0.5 rounded-full mt-1">Replicate API</span>
                                </button>
                            </div>

                            {mediaType === 'video' && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-start gap-4">
                                    <Sparkles className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-purple-900 text-sm">Asistent Video AI</h4>
                                        <p className="text-xs text-purple-700 mt-1">Selectează 2-3 poze din galeria ultimei tale instalări, iar AI-ul le va transforma într-un video cinematic scurt (Reel/TikTok) folosind tranziții fluide.</p>
                                        <button className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-colors">
                                            Configurează Replicate...
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-gray-700">Descriere Text (Caption)</label>
                                <button className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:text-orange-700">
                                    <Sparkles className="w-3 h-3" />
                                    Scrie cu AI
                                </button>
                            </div>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={6}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none bg-white text-sm"
                                placeholder="Scrie ceva pentru audiența ta... Ex: O nouă instalare Daikin finalizată astăzi în sectorul 2!"
                            />

                            <div className="flex gap-2 mt-3">
                                <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" title="Locație">
                                    <MapPin className="w-4 h-4" />
                                </button>
                                <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" title="Hashtag-uri">
                                    <span className="font-bold text-xs">#</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center bg-gray-50/50">
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={publishNow}
                                    onChange={(e) => setPublishNow(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                />
                                <span className="text-sm font-bold text-gray-900">Publică ACUM</span>
                            </label>

                            {!publishNow && (
                                <div className="flex items-center gap-2 mt-1 transition-opacity">
                                    <span className="text-xs font-bold text-gray-500 mr-1">sau planifică la:</span>
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    />
                                    <input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                                Anulează
                            </button>
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling}
                                className={`bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-orange-500/20 transition-transform flex items-center gap-2 ${isScheduling ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                <Send className="w-4 h-4" />
                                {isScheduling
                                    ? (publishNow ? 'Se publică...' : 'Se salvează...')
                                    : (publishNow ? 'Publică Acum!' : (postToEdit ? 'Salvează Modificările' : 'Planifică Postarea'))
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Live Previews */}
                <div className="w-1/2 bg-gray-100 flex flex-col items-center">
                    <div className="w-full p-4 border-b border-gray-200 flex justify-center gap-4 bg-white/50 backdrop-blur-sm">
                        <button onClick={() => setActivePreview('facebook')} className={`font-bold text-sm transition-colors border-b-2 pb-1 ${activePreview === 'facebook' ? 'border-[#1877F2] text-[#1877F2]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Facebook Feed</button>
                        <button onClick={() => setActivePreview('instagram')} className={`font-bold text-sm transition-colors border-b-2 pb-1 ${activePreview === 'instagram' ? 'border-[#E4405F] text-[#E4405F]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Insta Story</button>
                        <button onClick={() => setActivePreview('tiktok')} className={`font-bold text-sm transition-colors border-b-2 pb-1 ${activePreview === 'tiktok' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>TikTok Video</button>
                    </div>

                    <div className="flex-1 w-full flex items-center justify-center p-8 overflow-y-auto">

                        {/* Facebook Preview Card */}
                        {activePreview === 'facebook' && (
                            <div className="bg-white w-[400px] rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold">C</div>
                                    <div className="leading-tight">
                                        <div className="font-bold text-sm text-gray-900">ClimaticPRO</div>
                                        <div className="text-[11px] text-gray-500">Chiar acum • <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span></div>
                                    </div>
                                </div>
                                <div className="px-3 pb-3 text-sm text-gray-800 whitespace-pre-wrap">
                                    {text || <span className="text-gray-400 italic">Descrierea ta va apărea aici...</span>}
                                </div>
                                {mediaType !== 'none' ? (
                                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">
                                        {mediaType === 'video' ? <Video className="w-12 h-12" /> : <ImageIcon className="w-12 h-12" />}
                                    </div>
                                ) : (
                                    <div className="w-full h-1 bg-gray-100"></div>
                                )}
                                <div className="p-2 border-t border-gray-100 flex gap-1">
                                    <button className="flex-1 py-1.5 hover:bg-gray-100 text-gray-500 text-xs font-bold rounded flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> Like</button>
                                    <button className="flex-1 py-1.5 hover:bg-gray-100 text-gray-500 text-xs font-bold rounded flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3" /> Comment</button>
                                </div>
                            </div>
                        )}

                        {/* Instagram Story Preview */}
                        {activePreview === 'instagram' && (
                            <div className="bg-black w-[320px] h-[580px] rounded-[2rem] shadow-xl border-8 border-gray-800 overflow-hidden relative text-white animate-in fade-in zoom-in-95 duration-200">
                                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                                    {mediaType === 'video' ? (
                                        <div className="text-center">
                                            <Video className="w-16 h-16 opacity-30 mx-auto mb-2" />
                                            <p className="text-gray-500 text-xs font-bold font-mono">IG REEL / STORY</p>
                                        </div>
                                    ) : mediaType === 'image' ? (
                                        <ImageIcon className="w-16 h-16 opacity-30" />
                                    ) : (
                                        <p className="text-gray-500 text-xs italic">Niciun media atașat.</p>
                                    )}
                                </div>

                                <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-black/20 p-1.5 pr-3 rounded-full backdrop-blur-md">
                                    <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-pink-500 rounded-full p-[2px]">
                                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-xs">C</div>
                                    </div>
                                    <div className="font-bold text-sm drop-shadow-md">climaticpro <span className="text-gray-300 ml-1 font-normal">2h</span></div>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="text-sm drop-shadow-md whitespace-pre-wrap text-center bg-black/40 p-3 rounded-xl backdrop-blur-md">
                                        {text || 'Scrie descrierea postării tale...'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TikTok Video Preview */}
                        {activePreview === 'tiktok' && (
                            <div className="bg-black w-[320px] h-[580px] rounded-[2rem] shadow-xl border-8 border-gray-800 overflow-hidden relative text-white animate-in fade-in zoom-in-95 duration-200">
                                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 to-transparent z-10 flex justify-center items-center gap-4 text-gray-300/80 font-bold text-sm">
                                    <span>Urmărești</span>
                                    <span className="text-white relative">Pentru tine<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full"></div></span>
                                </div>

                                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                                    {mediaType === 'video' ? (
                                        <div className="text-center">
                                            <Video className="w-16 h-16 opacity-30 mx-auto mb-2" />
                                            <p className="text-gray-500 text-xs font-bold font-mono">TIKTOK AI GENERATED</p>
                                        </div>
                                    ) : mediaType === 'image' ? (
                                        <ImageIcon className="w-16 h-16 opacity-30" />
                                    ) : (
                                        <p className="text-gray-500 text-xs italic">Atașează media.</p>
                                    )}
                                </div>

                                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
                                    <div className="relative mb-2">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold border border-gray-300">C</div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FE2C55] rounded-full flex items-center justify-center text-white text-[10px] pb-px leading-none">+</div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 group"><Heart className="w-8 h-8 drop-shadow-lg group-hover:fill-[#FE2C55] transition-colors" /><span className="text-xs font-bold drop-shadow-md">0</span></div>
                                    <div className="flex flex-col items-center gap-1"><MessageCircle className="w-8 h-8 drop-shadow-lg" /><span className="text-xs font-bold drop-shadow-md">0</span></div>
                                    <div className="flex flex-col items-center gap-1"><Bookmark className="w-8 h-8 drop-shadow-lg" /><span className="text-xs font-bold drop-shadow-md">0</span></div>
                                    <div className="flex flex-col items-center gap-1"><Share2 className="w-8 h-8 drop-shadow-lg" /><span className="text-xs font-bold drop-shadow-md">0</span></div>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 p-4 pt-20 bg-gradient-to-t from-black via-black/60 to-transparent pr-16">
                                    <div className="font-bold text-sm mb-1.5 drop-shadow-md">@climaticpro</div>
                                    <div className="text-sm line-clamp-3 mb-3 drop-shadow-md text-gray-100">
                                        {text || 'Scrie descrierea tiktok-ului tău... '}
                                        <span className="font-bold text-white relative z-10"> #climaticpro #montaj</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold drop-shadow-md animate-marquee whitespace-nowrap overflow-hidden max-w-[200px]">
                                        <Music className="w-4 h-4 shrink-0" />
                                        <span>sunet original - Climatic PRO </span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
