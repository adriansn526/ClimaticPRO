'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ImagePlus, Trash2, Link } from 'lucide-react';

export default function AdminMarketingBanners() {
    const [banners, setBanners] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [prompt, setPrompt] = useState<string>('');
    const [latestGenerated, setLatestGenerated] = useState<string | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetchBanners();
        fetchProducts();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/admin/banners');
            const data = await res.json();
            if (Array.isArray(data)) setBanners(data);
        } catch (e) {
            console.error('Failed to load banners');
        }
    };

    const fetchProducts = async () => {
        try {
            // Reusing existing API for products
            const res = await fetch('/api/mobile/b2b-products');
            const data = await res.json();
            if (Array.isArray(data)) setProducts(data);
        } catch (e) {
            console.error('Failed to load products');
        }
    };

    const toggleActive = async (bannerId: number, currentStatus: boolean) => {
        await fetch('/api/admin/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: bannerId, active: !currentStatus })
        });
        fetchBanners();
    };

    const deleteBanner = async (bannerId: number) => {
        if (!confirm('Ștergi ireversibil acest banner promoțional?')) return;
        await fetch(`/api/admin/banners?id=${bannerId}`, { method: 'DELETE' });
        fetchBanners();
    };

    const handleGenerate = async () => {
        if (selectedProducts.length === 0) return alert('Selectează cel puțin un produs întâi!');
        
        // Imaginea de referință va fi primul produs selectat (Replicate ia doar un singur fișier imagine ca sursă)
        const mainProd = products.find(p => p.id === Number(selectedProducts[0]));
        if (!mainProd || !mainProd.image) return alert('Primul produs nu are imagine setată în WooCommerce pentru a fi folosită de AI!');

        setIsGenerating(true);
        setStatusMessage('AI analizează input-ul (Replicate)...');
        
        // Construim un detaliu clar pe care AI-ul să încerce să îl scrie/interpreteze
        const packageDetails = selectedProducts.map(id => {
            const p = products.find(pr => pr.id === Number(id));
            if(!p) return '';
            return `Pachet incluzând "${p.name}" (Preț: ${p.priceRetail || p.priceB2B || ''} RON)`;
        }).filter(Boolean).join(', ');

        const combinedPrompt = `${packageDetails}. ${prompt}`;

        try {
            const res = await fetch('/api/admin/banners/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: combinedPrompt,
                    productImageUrl: mainProd.image
                })
            });
            const data = await res.json();
            
            if (data.predictionId) {
                pollStatus(data.predictionId, mainProd.name);
            } else {
                alert('Eroare: ' + data.error);
                setIsGenerating(false);
            }
        } catch (e) {
            alert('A eșuat rețeaua.');
            setIsGenerating(false);
        }
    };

    const pollStatus = async (predictionId: string, prodName: string) => {
        setStatusMessage('AI redesenează imaginea în fundal...');
        
        const interval = setInterval(async () => {
            const res = await fetch(`/api/admin/banners/generate/${predictionId}`);
            const data = await res.json();
            
            if (data.status === 'succeeded') {
                clearInterval(interval);
                setStatusMessage('Decor generat cu succes! Se salvează pe server...');
                
                // Get output array (Replicate usually returns array of strings for images)
                const outUrl = Array.isArray(data.output) ? data.output[0] : data.output;
                
                // Save DB
                await fetch('/api/admin/banners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `AI Promo: ${prodName}`,
                        imageUrl: outUrl,
                        active: true,
                    })
                });
                
                fetchBanners();
                setIsGenerating(false);
                setPrompt('');
                setSelectedProducts([]);
                setProductSearchTerm('');
                setLatestGenerated(outUrl);
                setStatusMessage('');
            } else if (data.status === 'failed' || data.error) {
                clearInterval(interval);
                alert('AI-ul a întâmpinat o eroare (Replicate timeout/fail).');
                setIsGenerating(false);
            }
        }, 3000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* AI Generator Box */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                    <div>
                        <h3 className="text-xl font-bold text-indigo-900">AI Banner Builder (Replicate Img2Img)</h3>
                        <p className="text-sm text-indigo-700">Transformă instant imaginile simple ale produselor în reclame vizuale cinematografice.</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-indigo-50 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Produse Pachet (Primul dictează imaginea AI)</label>
                        
                        {/* Selected Chips */}
                        {selectedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                {selectedProducts.map(id => {
                                    const p = products.find(pr => pr.id.toString() === id.toString());
                                    if(!p) return null;
                                    return (
                                        <div key={id} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                                            <span className="max-w-[200px] truncate">{p.name}</span>
                                            <button 
                                                onClick={() => setSelectedProducts(prev => prev.filter(x => x !== id))} 
                                                className="text-white hover:text-red-200 ml-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder={selectedProducts.length > 0 ? "Adaugă alt produs completare (ex: țeavă...)" : "Caută produsul principal..."}
                                value={productSearchTerm}
                                onFocus={() => setIsDropdownOpen(true)}
                                onChange={(e) => {
                                    setProductSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                disabled={isGenerating}
                            />
                            {/* Down Arrow / Close Icon */}
                            <div 
                                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                                onClick={() => !isGenerating && setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {isDropdownOpen ? <Trash2 className="w-5 h-5 text-gray-300" /> : <Loader2 className="w-5 h-5 text-gray-300 opacity-0" />}
                            </div>
                        </div>

                        {/* Dropdown Options */}
                        {isDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                {products.filter(p => !selectedProducts.includes(p.id.toString()) && p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 text-center">Niciun produs adițional găsit.</div>
                                ) : (
                                    products
                                        .filter(p => !selectedProducts.includes(p.id.toString()) && p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                        .map(p => (
                                            <div 
                                                key={p.id} 
                                                className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                                onClick={() => {
                                                    setSelectedProducts(prev => [...prev, p.id.toString()]);
                                                    setProductSearchTerm('');
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded bg-white border border-gray-100" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-900 line-clamp-2">{p.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                        SKU: {p.sku || p.id} | <span className="text-indigo-600 font-semibold">{p.priceRetail || p.priceB2B || '?'} RON</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Instrucțiuni Adiționale (Background Decor)</label>
                        <textarea 
                            placeholder="Ex: Amplasat pe o terasă. Pe un text mare scrie prețul produsului. Stil cinematic hyper-realist."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating}
                            className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[140px] resize-y"
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {latestGenerated ? (
                        <div className="flex-1 flex items-center gap-4 bg-green-50 border border-green-200 p-3 rounded-xl animate-in fade-in zoom-in duration-500">
                            <img src={latestGenerated} alt="Preview AI" className="w-16 h-16 object-cover rounded shadow" />
                            <div>
                                <p className="text-sm font-bold text-green-900">Ultimul Banner Filmat / Generat</p>
                                <p className="text-xs text-green-700">A fost salvat cu succes și este trimis aplicației.</p>
                            </div>
                        </div>
                    ) : <div className="flex-1" />}

                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 justify-center w-full md:w-auto ml-auto"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                        {isGenerating ? statusMessage : 'Trimite Către AI DALL-E/Replicate'}
                    </button>
                </div>
            </div>

            {/* Banners Gallery */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Galerie Activă (E-Shop App)</h3>
                
                {banners.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                        Niciun banner disponibil. Primele 2 vor apărea pe ecranul instalatorilor.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map(b => (
                            <div key={b.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col relative bg-white">
                                {!b.active && (
                                    <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-sm flex items-center justify-center">
                                        <span className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg">Ascuns</span>
                                    </div>
                                )}
                                
                                <img src={b.imageUrl} alt={b.title} className="w-full h-40 object-cover bg-gray-100" />
                                
                                <div className="p-4 z-20 flex-1 flex flex-col">
                                    <h4 className="font-bold text-gray-900 truncate mb-1">{b.title}</h4>
                                    
                                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                                        <button 
                                            onClick={() => toggleActive(b.id, b.active)}
                                            className={`flex-1 font-bold py-2 rounded border text-sm ${b.active ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-gray-600 bg-gray-50 border-gray-300'}`}
                                        >
                                            {b.active ? 'Ascunde' : 'Afișează'}
                                        </button>
                                        <button onClick={() => deleteBanner(b.id)} className="p-2 border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
