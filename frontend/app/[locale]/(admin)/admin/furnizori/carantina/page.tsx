'use client';

import { useState, useEffect } from 'react';
import { Package, Check, X, Search, Link as LinkIcon, AlertTriangle, Zap, Trash2, Bot, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';

interface SuggestedProduct {
  id: number;
  name: string;
  priceB2B: number;
  image: string | null;
  sku: string | null;
  suppliers?: { supplier: { name: string } }[];
}

interface Supplier {
  id: number;
  name: string;
}

interface UnmappedProduct {
  id: number;
  supplierProductUrl: string;
  extractedName: string;
  extractedPrice: number;
  extractedStock: string;
  lastScrapedAt: string;
  status: string;
  similarityScore: number | null;
  suggestedProductId: number | null;
  supplier: Supplier;
  suggestedProduct: SuggestedProduct | null;
}

interface B2BProductOption {
  id: number;
  name: string;
  sku: string | null;
}

interface AiInsightData {
  unmappedId: number;
  unmappedName: string;
  normalizedName: string;
  brand: string | null;
  capacity: string | null;
  modelCode: string | null;
  recommendedCategorySlug: string;
  recommendedCategoryId: number | null;
  confidenceScore: number;
  reasoning: string;
}

export default function QuarantinePage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<UnmappedProduct[]>([]);
  const [b2bProducts, setB2bProducts] = useState<B2BProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  
  // DataGrid State
  const [filterMode, setFilterMode] = useState<'all' | 'with_ai' | 'without_ai'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' } | null>(null);
  
  // Bulk map
  const [bulkThreshold, setBulkThreshold] = useState<number>(90);
  const [isBulkMapping, setIsBulkMapping] = useState(false);

  // Manual map
  const [mappingProduct, setMappingProduct] = useState<UnmappedProduct | null>(null);
  const [selectedB2bId, setSelectedB2bId] = useState<string>('');
  const [isMapping, setIsMapping] = useState(false);

  // Deep Scrape Import
  const [importingProduct, setImportingProduct] = useState<UnmappedProduct | null>(null);
  const [isDeepScraping, setIsDeepScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [importForm, setImportForm] = useState({
      title: '',
      price: 0,
      descriptionHtml: '',
      categoryId: '',
      imageUrl: ''
  });
  const [isSavingImport, setIsSavingImport] = useState(false);
  
  // AI Prediction State
  const [aiPredictingId, setAiPredictingId] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInsightResult, setAiInsightResult] = useState<AiInsightData | null>(null);

  // Bulk Engine State
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<{ id: number; status: 'pending'|'processing'|'success'|'error', error?: string }[]>([]);
  const [isBulkProcessingRunning, setIsBulkProcessingRunning] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  // Inline Search Componenent
  const InlineProductSearch = ({ b2bProducts, onSelect }: { b2bProducts: B2BProductOption[], onSelect: (id: number) => void }) => {
      const [search, setSearch] = useState('');
      const [open, setOpen] = useState(false);
      
      const filtered = b2bProducts.filter(b => 
          b.name.toLowerCase().includes(search.toLowerCase()) || 
          (b.sku && b.sku.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 15);

      return (
          <div className="relative mt-2 w-full max-w-[300px]">
              <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input 
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setOpen(true)}
                      onBlur={() => setTimeout(() => setOpen(false), 200)}
                      placeholder="Caută în site și asociază..."
                      className="w-full text-xs pl-7 pr-2 py-1.5 border border-blue-200 bg-white rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
              </div>
              
              {open && search.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-[300px] overflow-y-auto w-[400px]">
                      {filtered.length === 0 ? (
                          <div className="p-3 text-xs text-center text-gray-500 font-bold">Niciun produs găsit.</div>
                      ) : (
                          filtered.map((b: any) => (
                              <div 
                                  key={b.id} 
                                  onMouseDown={(e) => {
                                      e.preventDefault();
                                      setSearch(b.name);
                                      setOpen(false);
                                      onSelect(b.id);
                                  }}
                                  className="px-3 py-2 text-xs border-b border-gray-100 hover:bg-blue-50 cursor-pointer text-left"
                              >
                                  <div className="font-bold text-gray-800 break-words">{b.name}</div>
                                  {b.sku && <div className="text-gray-400 mt-0.5 text-[10px]">SKU: {b.sku}</div>}
                              </div>
                          ))
                      )}
                  </div>
              )}
          </div>
      );
  };

  useEffect(() => {
    // Check initial supplier filter from URL e.g. ?supplierId=5
    const params = new URLSearchParams(window.location.search);
    const initialSupp = params.get('supplierId');
    if (initialSupp) {
        setSelectedSupplierId(initialSupp);
    }
    
    fetchQuarantine();
    fetchB2BProducts();
  }, []);

  const fetchQuarantine = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/suppliers/quarantine');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      showToast('Eroare la încărcarea carantinei', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchB2BProducts = async () => {
    try {
      const res = await fetch('/api/admin/b2b-products?limit=2000');
      const data = await res.json();
      if (data.success) {
        setB2bProducts(data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        })));
      }
    } catch (error) {}
  };

  const handleAction = async (unmappedId: number, action: 'map' | 'ignore', productId?: number) => {
    try {
      const endpoint = action === 'map' ? '/api/admin/suppliers/quarantine/map' : '/api/admin/suppliers/quarantine/ignore';
      const body = action === 'map' ? { unmappedId, productId } : { unmappedId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showToast(action === 'map' ? 'Produs asociat cu succes.' : 'Produs ignorat.', 'success');
        setProducts(products.filter(p => p.id !== unmappedId));
        setMappingProduct(null);
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Eroare de conexiune', 'error');
    }
  };

  const handleAiPredict = async (unmappedId: number) => {
      setAiPredictingId(unmappedId);
      try {
          const res = await fetch('/api/admin/suppliers/quarantine/ai-analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ unmappedId })
          });
          const json = await res.json();
          if (json.success) {
              const info = json.ai;
              const unmappedObj = products.find(p => p.id === unmappedId);
              setAiInsightResult({
                 unmappedId,
                 unmappedName: unmappedObj?.extractedName || '',
                 ...info
              });
              setAiModalOpen(true);
          } else {
              showToast(json.message, 'error');
          }
      } catch (e) {
          showToast('Eroare conexiune OpenAI', 'error');
      } finally {
          setAiPredictingId(null);
      }
  };

  const handleBulkMap = async () => {
    if (!confirm(`Ești sigur că vrei să asociezi automat produsele vizibile în acest moment cu scor de minim ${bulkThreshold}%?`)) return;

    setIsBulkMapping(true);
    try {
      // Daca suntem filtrati, dam param ?supplierId
      const endp = selectedSupplierId !== 'all' 
            ? `/api/admin/suppliers/quarantine/bulk-map?supplierId=${selectedSupplierId}`
            : `/api/admin/suppliers/quarantine/bulk-map`;

      const res = await fetch(endp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minScore: bulkThreshold })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchQuarantine(); // Refresh list
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Eroare la procesarea în masă', 'error');
    } finally {
      setIsBulkMapping(false);
    }
  };

  const handleBulkMapSelected = async () => {
    const itemsWithSuggestions = products.filter(p => selectedIds.includes(p.id) && !!p.suggestedProduct);
    if (itemsWithSuggestions.length === 0) {
        showToast("Niciun produs selectat nu are sugestie AI.", "error");
        return;
    }
    if (!confirm(`Mapăm ${itemsWithSuggestions.length} produse selectate?`)) return;
    
    try {
        let successCount = 0;
        for(const p of itemsWithSuggestions) {
            const res = await fetch('/api/admin/suppliers/quarantine/map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unmappedId: p.id, productId: p.suggestedProduct!.id })
            });
            if((await res.json()).success) successCount++;
        }
        showToast(`${successCount} produse mapate cu succes!`, "success");
        setSelectedIds([]);
        fetchQuarantine();
    } catch(e) {
        showToast("Eroare la maparea în masă.", "error");
    }
  };

  const handleBulkIgnore = async () => {
      if (!confirm(`Ștergi definitiv ${selectedIds.length} produse?`)) return;
      try {
          let successCount = 0;
          for(const id of selectedIds) {
              const res = await fetch('/api/admin/suppliers/quarantine/ignore', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ unmappedId: id })
              });
              if((await res.json()).success) successCount++;
          }
          showToast(`${successCount} șterse!`, "success");
          setSelectedIds([]);
          fetchQuarantine();
      } catch(e) {
          showToast("Eroare la ștergerea în masă.", "error");
      }
  };

  useEffect(() => {
     if (bulkImportModalOpen) {
         setBulkQueue(selectedIds.map(id => ({ id, status: 'pending' })));
     }
  }, [bulkImportModalOpen, selectedIds]);

  const startBulkProcessing = async () => {
      setIsBulkProcessingRunning(true);
      const queue = [...bulkQueue];

      for (let i = 0; i < queue.length; i++) {
          if (queue[i].status !== 'pending') continue;

          // Update Status
          queue[i].status = 'processing';
          setBulkQueue([...queue]);

          try {
              const productToScrape = products.find(p => p.id === queue[i].id);
              let sData: any = {};

              const isFictionalUrl = productToScrape?.supplierProductUrl?.startsWith('md://') || productToScrape?.supplierProductUrl?.startsWith('pdf://');

              if (!isFictionalUrl) {
                  // 1. Deep Scrape (Aducem textele)
                  const scrapeRes = await fetch('/api/admin/suppliers/quarantine/deep-scrape', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ unmappedId: queue[i].id })
                  });
                  const scrapeJson = await scrapeRes.json();
                  sData = scrapeJson.success ? scrapeJson.data : {};
              }

              // 2. Intercepție AI Copilot (NLP)
              let title = sData.title || productToScrape?.extractedName;
              let categoryId = sData.recommendedCategoryId?.toString() || bulkCategoryId || '';
              const price = sData.price || productToScrape?.extractedPrice;
              const descriptionHtml = sData.descriptionHtml || '';
              const imageUrl = sData.images && sData.images.length > 0 ? sData.images[0] : '';
              
              const aiRes = await fetch('/api/admin/suppliers/quarantine/ai-analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ unmappedId: queue[i].id })
              });
              const aiJson = await aiRes.json();
              if (aiJson.success && aiJson.ai?.normalizedName) {
                  title = aiJson.ai.normalizedName;
                  if (aiJson.ai.recommendedCategoryId) {
                      categoryId = aiJson.ai.recommendedCategoryId.toString();
                  }
              }

              if (!title || !price) {
                  throw new Error('Date insuficiente pentru import direct.');
              }

              // 3. Salvare finală curată
              const importRes = await fetch('/api/admin/suppliers/quarantine/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      unmappedId: queue[i].id,
                      title,
                      price,
                      descriptionHtml,
                      categoryId,
                      imageUrl
                  })
              });
              const importJson = await importRes.json();
              
              if(!importJson.success) throw new Error(importJson.message);
              queue[i].status = 'success';

          } catch (e: any) {
              queue[i].status = 'error';
              queue[i].error = e.message;
          }

          setBulkQueue([...queue]);
      }
      setIsBulkProcessingRunning(false);
      showToast('Procesare în masă finalizată!', 'success');
      fetchQuarantine();
  };

  const handleStartImport = async (p: UnmappedProduct) => {
      setImportingProduct(p);
      setIsDeepScraping(true);
      setScrapedData(null);
      try {
          const res = await fetch('/api/admin/suppliers/quarantine/deep-scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ unmappedId: p.id })
          });
          const json = await res.json();
          if (json.success) {
              setScrapedData(json.data);
              setImportForm({
                  title: json.data.title || p.extractedName,
                  price: json.data.price || p.extractedPrice,
                  descriptionHtml: json.data.descriptionHtml || '',
                  categoryId: json.data.recommendedCategoryId?.toString() || '',
                  imageUrl: json.data.images && json.data.images.length > 0 ? json.data.images[0] : ''
              });
          } else {
              showToast(json.message, 'error');
              setImportingProduct(null);
          }
      } catch (err) {
          showToast('Eroare la conectare către DeepBot', 'error');
          setImportingProduct(null);
      } finally {
          setIsDeepScraping(false);
      }
  };

  const submitImport = async () => {
      if (!importingProduct) return;
      setIsSavingImport(true);
      try {
          const res = await fetch('/api/admin/suppliers/quarantine/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  unmappedId: importingProduct.id,
                  ...importForm
              })
          });
          const data = await res.json();
          if (data.success) {
              showToast(data.message, 'success');
              setProducts(products.filter(p => p.id !== importingProduct.id));
              setImportingProduct(null);
          } else {
              showToast(data.message, 'error');
          }
      } catch (e) {
          showToast('Eroare la trimiterea datelor de import.', 'error');
      } finally {
          setIsSavingImport(false);
      }
  };

  // Determine unique suppliers for the Dropdown
  const uniqueSuppliers = Array.from(new Map(products.map(p => [p.supplier.id, p.supplier])).values());

  let result = products.filter(p => {
    const matchSearch = p.extractedName.toLowerCase().includes(searchTerm.toLowerCase()) || p.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSupplier = selectedSupplierId === 'all' || p.supplier.id.toString() === selectedSupplierId;
    
    let matchPill = true;
    if (filterMode === 'with_ai') matchPill = !!p.suggestedProduct;
    if (filterMode === 'without_ai') matchPill = !p.suggestedProduct;

    return matchSearch && matchSupplier && matchPill;
  });

  if (sortConfig) {
      result.sort((a, b) => {
          let aVal: any = a[sortConfig.key as keyof UnmappedProduct];
          let bVal: any = b[sortConfig.key as keyof UnmappedProduct];
          
          if (aVal === null) aVal = -999;
          if (bVal === null) bVal = -999;

          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }

  const filteredProducts = result;
  
  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const isAllSelected = filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;
  const toggleSelectAll = () => {
      if (isAllSelected) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredProducts.map(p => p.id));
      }
  };
  const toggleRow = (id: number) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(x => x !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carantină Produse</h1>
          <p className="text-gray-500 text-sm mt-1">Aceste produse au fost extrase din platformele furnizorilor dar nu au fost asociate ferm.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        
        {/* Top Filters Row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[250px] max-w-sm">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                   <input
                     type="text"
                     placeholder="Caută în denumirile extrase..."
                     className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="min-w-[200px]">
                <select
                    value={selectedSupplierId}
                    onChange={e => {
                        setSelectedSupplierId(e.target.value);
                        window.history.replaceState(null, '', e.target.value === 'all' ? window.location.pathname : `${window.location.pathname}?supplierId=${e.target.value}`);
                    }}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">🌐 Toți Furnizorii</option>
                    {uniqueSuppliers.map(s => (
                        <option key={s.id} value={s.id.toString()}>🏢 {s.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Action / Pills Row */}
        <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100">
             <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button onClick={()=>setFilterMode('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${filterMode === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Toate</button>
                 <button onClick={()=>setFilterMode('with_ai')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${filterMode === 'with_ai' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Cu Sugestie AI</button>
                 <button onClick={()=>setFilterMode('without_ai')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${filterMode === 'without_ai' ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>Fără Sugestie (Noi)</button>
             </div>
        </div>
      </div>

        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
           <Zap className="w-5 h-5 text-blue-600" />
           <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-blue-900">Mapare în masă peste: </span>
             <select 
               value={bulkThreshold} 
               onChange={(e) => setBulkThreshold(Number(e.target.value))}
               className="border-gray-300 rounded text-sm px-2 py-1 outline-none font-bold"
             >
               <option value={95}>95%</option>
               <option value={90}>90%</option>
               <option value={85}>85%</option>
               <option value={80}>80%</option>
             </select>
           </div>
           <button 
             onClick={handleBulkMap}
             disabled={isBulkMapping}
             className="ml-2 px-4 py-1.5 bg-blue-600 text-white font-bold rounded shadow-sm hover:bg-blue-700 text-sm flex items-center gap-2"
           >
             {isBulkMapping ? 'Așteaptă...' : 'Auto-Mapează'}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold select-none">
                <tr>
                    <th className="px-6 py-4 w-12 text-center border-b border-gray-200">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isAllSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-6 py-4">Sursă (Furnizor)</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('extractedName')}>
                        Produs Extras {sortConfig?.key === 'extractedName' ? (sortConfig.direction === 'asc' ? '⬆️' : '⬇️') : ''}
                    </th>
                    <th className="px-6 py-4 border-l border-gray-200 bg-blue-50/50">Sugestie Proprie (AI)</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('similarityScore')}>
                        Scor {sortConfig?.key === 'similarityScore' ? (sortConfig.direction === 'asc' ? '⬆️' : '⬇️') : '↕️'}
                    </th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">Se încarcă...</td></tr>
                ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">Niciun produs în carantină. Toate sunt mapate perfect! 🎉</td></tr>
                ) : filteredProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors group ${selectedIds.includes(p.id) ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-6 py-4 text-center">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.includes(p.id)} onChange={() => toggleRow(p.id)} />
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded mb-1">{p.supplier.name}</span>
                        </td>
                        <td className="px-6 py-4 w-1/3">
                            <a href={p.supplierProductUrl} target="_blank" rel="noreferrer" className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm block mb-1">
                                {p.extractedName} <LinkIcon className="inline w-3 h-3 ml-1" />
                            </a>
                            <div className="flex gap-2 text-xs">
                                <span className="font-bold text-gray-700">{p.extractedPrice} RON</span>
                                <span className="text-gray-400">•</span>
                                <span className={`font-bold ${p.extractedStock.includes('in') ? 'text-green-600' : 'text-red-500'}`}>
                                    {p.extractedStock}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 border-l border-gray-200 bg-blue-50/20 w-1/3">
                            {p.suggestedProduct ? (
                                <div>
                                    <div className="font-bold text-blue-900 text-sm mb-1">{p.suggestedProduct.name}</div>
                                    <div className="flex gap-2 text-xs">
                                        <span className="font-bold text-gray-700">La noi: {p.suggestedProduct.priceB2B} RON</span>
                                    </div>
                                    {p.suggestedProduct.suppliers && p.suggestedProduct.suppliers.length > 0 && (
                                        <div className="mt-2 text-[11px] text-gray-500 bg-white/50 p-1.5 rounded inline-block border border-gray-100 mb-2">
                                            Asociat deja cu: <span className="font-bold text-gray-700">{p.suggestedProduct.suppliers.map(s => s.supplier.name).join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="mt-1 pt-2 border-t border-blue-200/50">
                                         <InlineProductSearch b2bProducts={b2bProducts} onSelect={(id) => handleAction(p.id, 'map', id)} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-xs text-gray-400 italic mb-2 block">Nu s-a găsit o sugestie viabilă</span>
                                    <InlineProductSearch b2bProducts={b2bProducts} onSelect={(id) => handleAction(p.id, 'map', id)} />
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {p.similarityScore ? (
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.similarityScore > 90 ? 'bg-green-100 text-green-800' : p.similarityScore > 75 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                    {Math.round(p.similarityScore)}%
                                </span>
                            ) : (
                                '-'
                            )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                             {p.suggestedProduct && (
                                <button 
                                  onClick={() => handleAction(p.id, 'map', p.suggestedProduct!.id)}
                                  className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs rounded transition-colors"
                                  title="Acceptă sugestia curentă"
                                >
                                  ✅ Acceptă
                                </button>
                             )}
                             <button
                               onClick={() => handleAiPredict(p.id)}
                               disabled={aiPredictingId === p.id}
                               className={`px-3 py-1.5 font-bold text-xs rounded transition-colors ${aiPredictingId === p.id ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}
                             >
                               {aiPredictingId === p.id ? '⏳ NLP...' : '🧠 AI Predict'}
                             </button>
                             <button
                               onClick={() => handleStartImport(p)}
                               className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs rounded transition-colors"
                               title="Importă ca Produs Nou complet (Deep Scrape)"
                             >
                               🪄 Crează Produs
                             </button>
                             <button
                               onClick={() => {
                                 if (confirm('Sigur dorești să ignori definitiv acest produs? Nu va mai fi procesat la viitoarele scanări.')) {
                                   handleAction(p.id, 'ignore');
                                 }
                               }}
                               className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold text-xs rounded transition-colors"
                             >
                               ❌
                             </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {mappingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">Mapare Manuală</h3>
                    <button onClick={() => setMappingProduct(null)} className="text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs uppercase text-gray-500 font-bold mb-1">Produs Extras ({mappingProduct.supplier.name})</p>
                        <p className="font-bold text-gray-900 text-lg">{mappingProduct.extractedName}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Alege Produsul B2B Intern</label>
                        <select
                            value={selectedB2bId}
                            onChange={e => setSelectedB2bId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selectează un produs --</option>
                            {b2bProducts.map(b => (
                                <option key={b.id} value={b.id}>{b.name} {b.sku ? `(${b.sku})` : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setMappingProduct(null)} 
                        className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900"
                    >
                        Anulare
                    </button>
                    <button 
                        onClick={() => handleAction(mappingProduct.id, 'map', parseInt(selectedB2bId))}
                        disabled={!selectedB2bId || isMapping}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg"
                    >
                        Salvează Legătura
                    </button>
                </div>
            </div>
        </div>
      )}

      {importingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                         <Zap className="w-5 h-5 text-purple-600" />
                         Smart PIM Importer
                    </h3>
                    <button onClick={() => setImportingProduct(null)} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {isDeepScraping ? (
                         <div className="flex flex-col items-center justify-center py-20 text-center">
                              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                              <h4 className="text-xl font-bold text-gray-800">Bot-ul analizează site-ul sursă...</h4>
                              <p className="text-gray-500 mt-2">Descărcăm imaginile și extragem descrierea completă pentru <br/> <strong className="text-blue-600">{importingProduct.supplierProductUrl}</strong></p>
                         </div>
                    ) : scrapedData ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                  <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">Nume Final B2B</label>
                                     <input type="text" value={importForm.title} onChange={e => setImportForm({...importForm, title: e.target.value})} className="w-full border p-2 text-sm rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-1">Preț de Bază (RON)</label>
                                          <input type="number" value={importForm.price} onChange={e => setImportForm({...importForm, price: parseFloat(e.target.value)})} className="w-full border p-2 text-sm rounded focus:ring-2 focus:ring-purple-500 outline-none" />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-1">Categorie Asignată</label>
                                          <div className="p-2 border rounded bg-gray-50 text-sm font-semibold text-gray-700 h-[38px] cursor-not-allowed line-clamp-1" title={scrapedData.recommendedCategoryName || 'Nemapata'}>
                                              {scrapedData.recommendedCategoryName ? `✅ ${scrapedData.recommendedCategoryName}` : `⚠️ Lipsă mapare`}
                                          </div>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Poză Principală Detectată</label>
                                      {importForm.imageUrl ? (
                                           <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-2 flex items-center justify-center aspect-video">
                                               <img src={importForm.imageUrl} className="max-h-full object-contain mix-blend-multiply" alt="Preview"/>
                                           </div>
                                      ) : (
                                           <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center text-center text-gray-400 aspect-video justify-center">
                                                Fără imagine disponibilă. Botul nu a găsit imagini viabile.
                                           </div>
                                      )}
                                  </div>
                              </div>
                              <div className="space-y-4 flex flex-col">
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Descriere HTML Extrată</label>
                                  <div className="flex-1 bg-white border rounded-lg p-3 text-xs text-gray-600 overflow-y-auto max-h-[300px]" dangerouslySetInnerHTML={{ __html: importForm.descriptionHtml || '<em>Botul nu a găsit bloc de descriere pe această pagină...</em>' }} />
                                  
                                  {scrapedData.attributes && Object.keys(scrapedData.attributes).length > 0 && (
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-1">Specificații Găsite</label>
                                          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs">
                                              {Object.entries(scrapedData.attributes).map(([k, v]: any) => (
                                                  <div key={k} className="flex border-b border-blue-50/50 py-1 last:border-0"><span className="font-bold w-1/3 text-blue-900">{k}</span><span className="w-2/3">{v}</span></div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                         </div>
                    ) : null}
                </div>

                {!isDeepScraping && scrapedData && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button 
                            onClick={() => setImportingProduct(null)} 
                            className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900 transition"
                        >
                            Renunță
                        </button>
                        <button 
                            onClick={submitImport}
                            disabled={isSavingImport}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold rounded-lg transition"
                        >
                            {isSavingImport ? 'Se importă...' : 'Salvează Produs Nou B2B'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 border border-gray-700 backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
                      {selectedIds.length}
                  </div>
                  <span className="font-semibold text-sm whitespace-nowrap">produse marcate</span>
              </div>
              <div className="h-6 w-px bg-gray-700"></div>
              <div className="flex gap-3">
                  <button onClick={handleBulkMapSelected} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold shadow transition flex items-center gap-2 whitespace-nowrap">
                      ✅ Mapează Sugestiile
                  </button>
                  <button onClick={() => setBulkImportModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-lg text-sm font-bold shadow transition flex items-center gap-2 whitespace-nowrap">
                      🪄 Importă Nou (Bulk)
                  </button>
                  <button onClick={handleBulkIgnore} className="px-3 py-2 bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 rounded-lg text-sm font-bold transition flex items-center justify-center text-gray-300 hover:text-white" title="Ignoră Definitiv (Șterge)">
                      <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedIds([])} className="ml-2 text-gray-400 hover:text-white p-1" title="Deselectează Tot">
                      <X className="w-6 h-6" />
                  </button>
              </div>
          </div>
      )}

      {/* BULK PROCESSING QUEUE MODAL */}
      {bulkImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">📦 Procesare Centralizată PIM (Deep Scrape Bulk)</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Se va parcurge fiecare produs marcat în ordine. Bot-ul intră pe link-uri, extrage datele lipsă, le asociează categoria implicită și salvează automat imaginile. Acoperă-ți un ceai.
                </p>
              </div>
              {!isBulkProcessingRunning && (
                <button onClick={() => { setBulkImportModalOpen(false); setSelectedIds([]); }} className="text-gray-400 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {!isBulkProcessingRunning && bulkQueue.filter(q => q.status === 'success').length === 0 && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-4 mt-4">
                  <div className="flex-1">
                    <label className="text-sm font-bold text-blue-900 mb-1 block">Vrei o Categorie Centralizată de Bază?</label>
                    <select
                      value={bulkCategoryId}
                      onChange={e => setBulkCategoryId(e.target.value)}
                      className="w-full border border-blue-200 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="">Lasă-l pe Bot să recunoască de pe situl lor</option>
                      {/* Daca aveam query listam toate cat, altfel se alege default Diverse. Poti ignora p-asta */}
                      <option value="1">Aere Condiționate (ID: 1 Test)</option>
                    </select>
                    <p className="text-xs text-blue-500 mt-1">Dacă botul nu găsește categoria originală, produsele vor pica în Diversitate dacă lași gol, deci e bine să fii flexibil.</p>
                  </div>
                </div>
            )}

            <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {bulkQueue.map((item, idx) => {
                    const productData = products.find(p => p.id === item.id);
                    return (
                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                            <span className="font-semibold text-gray-700 truncate w-3/5">
                                {idx + 1}. {productData?.extractedName || `ID Extractor: ${item.id}`}
                            </span>
                            <div className="flex items-center w-1/3 justify-end gap-2">
                                {item.status === 'pending' && <span className="text-gray-400 text-xs font-bold bg-gray-100 px-2 rounded">💤 În așteptare</span>}
                                {item.status === 'processing' && <span className="text-blue-600 text-xs font-bold bg-blue-100 px-2 rounded flex items-center gap-1 animate-pulse"><Zap className="w-3 h-3"/> Analizare...</span>}
                                {item.status === 'success' && <span className="text-green-600 text-xs font-bold bg-green-100 px-2 rounded flex items-center gap-1"><Check className="w-3 h-3"/> Importat</span>}
                                {item.status === 'error' && <span className="text-red-600 text-[10px] font-bold bg-red-100 px-2 rounded max-w-[120px] truncate" title={item.error}>{item.error}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-4">
              {!isBulkProcessingRunning && bulkQueue.some(q => q.status === 'pending') && (
                <button
                  onClick={startBulkProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" /> Pornește Motorul DeepScrape ({bulkQueue.length})
                </button>
              )}
              {isBulkProcessingRunning && (
                <button disabled className="px-6 py-2.5 bg-gray-400 text-white font-bold rounded-lg cursor-not-allowed">
                  Scraping în desfășurare...
                </button>
              )}
              {!isBulkProcessingRunning && !bulkQueue.some(q => q.status === 'pending') && (
                <button
                  onClick={() => { setBulkImportModalOpen(false); setSelectedIds([]); }}
                  className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                >
                  Închide și Vezi Catalogul
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Insight Framer Modal */}
      <AnimatePresence>
        {aiModalOpen && aiInsightResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setAiModalOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-slate-900 border-l border-white/10 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Bot size={24} className="text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-medium text-white">Rezultat Analiză NLP</h2>
                </div>
                <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium tracking-wide">DENUMIRE ORIGINALĂ FURNIZOR</p>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-white/5">{aiInsightResult.unmappedName}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium tracking-wide">NUME COMERCIAL NORMALIZAT</p>
                  <p className="text-base font-semibold text-white bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">{aiInsightResult.normalizedName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-400 mb-1">Brand Echipament</p>
                        <p className="font-semibold text-sky-400">{aiInsightResult.brand || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-400 mb-1">Capacitate BTU</p>
                        <p className="font-semibold text-emerald-400">{aiInsightResult.capacity || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 col-span-2">
                        <p className="text-xs text-slate-400 mb-1">Cod Model / Seria</p>
                        <p className="font-semibold text-fuchsia-400 tracking-wider font-mono">{aiInsightResult.modelCode || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-slate-400 font-medium tracking-wide">SCOR ÎNCREDERE AI</p>
                    <span className={`text-xl font-bold ${aiInsightResult.confidenceScore > 85 ? 'text-green-400' : aiInsightResult.confidenceScore > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {aiInsightResult.confidenceScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${aiInsightResult.confidenceScore > 85 ? 'bg-green-500' : aiInsightResult.confidenceScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${aiInsightResult.confidenceScore}%` }}
                      />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium tracking-wide">RAȚIONAMENT EXTRACȚIE</p>
                  <p className="text-sm text-slate-300 italic bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 leading-relaxed">
                    &ldquo;{aiInsightResult.reasoning}&rdquo;
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-4 bg-slate-800/50">
                <button 
                  onClick={() => setAiModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                >
                  Închide
                </button>
                <button 
                  onClick={() => {
                      setAiModalOpen(false);
                      setMappingProduct(products.find(p => p.id === aiInsightResult.unmappedId) || null);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Search size={18} /> Re-mapează Manual
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
