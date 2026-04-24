'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, ChevronDown, Check, Filter } from 'lucide-react';

export type FilterField = 'status' | 'syncStatus' | 'installStatus' | 'categoryIds' | 'supplierIds' | 'profitMarginWarning' | 'maxProfit' | 'titleContains' | 'marginValue';

export interface RangeValue {
    min?: string;
    max?: string;
}

export interface FilterCondition {
    id: string;
    field: FilterField;
    value: any;
}

interface PostHogFiltersProps {
    filters: FilterCondition[];
    onChange: (filters: FilterCondition[]) => void;
    wooCategories: any[];
    suppliers: any[];
}

const FIELD_CONFIGS: Record<FilterField, { label: string, type: 'text' | 'select' | 'multi-select' | 'multi-tree' | 'boolean' | 'number' | 'number-range', options?: any[], description?: string }> = {
    titleContains: { label: 'Numele Produsului Conține', type: 'text' },
    status: {
        label: 'Status Produs',
        type: 'select',
        options: [{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Suspendate' }]
    },
    syncStatus: {
        label: 'Status Sincronizare',
        type: 'select',
        options: [{ id: 'synced', name: 'Sincronizate ✅' }, { id: 'not_synced', name: 'Nesincronizate ➖' }]
    },
    installStatus: {
        label: 'Montaj Obligatoriu',
        type: 'select',
        options: [{ id: 'forced', name: 'Da (Obligatoriu)' }, { id: 'optional', name: 'Nu (Opțional)' }]
    },
    categoryIds: { label: 'Categorii WooCommerce', type: 'multi-tree' },
    supplierIds: { label: 'Furnizori', type: 'multi-select' },
    profitMarginWarning: { label: 'Alertă Preț/Marjă', type: 'boolean' },
    maxProfit: { label: 'Profit B2B (RON)', type: 'number-range', description: 'Filtrează produse după profitul (Preț B2B - Cost Furnizor).' },
    marginValue: { label: 'Adaos Comercial Setat', type: 'number-range', description: 'Filtrează după valoarea adaosului comercial configurat pe produs.' }
};

export default function PostHogFilters({ filters, onChange, wooCategories, suppliers }: PostHogFiltersProps) {
    const [isAdding, setIsAdding] = useState(false);
    const addRef = useRef<HTMLDivElement>(null);

    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (addRef.current && !addRef.current.contains(e.target as Node)) {
                setIsAdding(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addFilter = (field: FilterField) => {
        // Prevent duplicate unique boolean/select logic, wait, posthog allows multiple but we usually merge.
        // If field already exists, just open it, otherwise add it.
        const existing = filters.find(f => f.field === field);
        if (existing) {
             setIsAdding(false);
             return;
        }

        const newId = Math.random().toString(36).substr(2, 9);
        let defaultVal: any = '';
        if (FIELD_CONFIGS[field].type === 'multi-select' || FIELD_CONFIGS[field].type === 'multi-tree') defaultVal = { ids: [], exclude: false };
        if (FIELD_CONFIGS[field].type === 'boolean') defaultVal = true;
        if (FIELD_CONFIGS[field].type === 'select') defaultVal = FIELD_CONFIGS[field].options?.[0]?.id || '';
        if (FIELD_CONFIGS[field].type === 'number-range') defaultVal = { min: '', max: '' } as RangeValue;

        onChange([...filters, { id: newId, field, value: defaultVal }]);
        setIsAdding(false);
    };

    const removeFilter = (id: string) => {
        onChange(filters.filter(f => f.id !== id));
    };

    const updateFilterParams = (id: string, val: any) => {
        onChange(filters.map(f => f.id === id ? { ...f, value: val } : f));
    };

    const availableFields = (Object.keys(FIELD_CONFIGS) as FilterField[]).filter(k => !filters.some(f => f.field === k));

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-700 flex items-center mr-2"><Filter className="w-4 h-4 mr-1 text-gray-400" /> Filtre (Match All)</span>
                
                {filters.map(filter => (
                    <FilterPill 
                        key={filter.id} 
                        filter={filter} 
                        onRemove={() => removeFilter(filter.id)}
                        onUpdate={(val: any) => updateFilterParams(filter.id, val)}
                        wooCategories={wooCategories}
                        suppliers={suppliers}
                    />
                ))}

                {availableFields.length > 0 && (
                    <div className="relative" ref={addRef}>
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors bg-gray-50"
                        >
                            <Plus className="w-4 h-4" /> Add filter <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                        
                        {isAdding && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-50 overflow-hidden py-1">
                                {availableFields.map(field => (
                                    <button 
                                        key={field}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 font-medium border-b border-gray-50 last:border-0"
                                        onClick={() => addFilter(field)}
                                    >
                                        {FIELD_CONFIGS[field].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {filters.length > 0 && (
                     <button onClick={() => onChange([])} className="text-xs text-red-500 font-bold hover:underline ml-auto">Reset Filters</button>
                )}
            </div>
        </div>
    );
}

function FilterPill({ filter, onRemove, onUpdate, wooCategories, suppliers }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const popRef = useRef<HTMLDivElement>(null);
    const config = FIELD_CONFIGS[filter.field as FilterField];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popRef.current && !popRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Format display value
    let displayValue = String(filter.value);
    if (config.type === 'boolean') displayValue = filter.value ? 'Da' : 'Nu';
    if (config.type === 'select') displayValue = config.options?.find(o => o.id === filter.value)?.name || filter.value;
    if (config.type === 'multi-select') {
        const val = filter.value;
        const ids = Array.isArray(val) ? val : (val?.ids || []);
        const isExclude = val?.exclude || false;
        const c = ids.length;
        displayValue = c > 0 ? `${isExclude ? '≠ ' : ''}${c} selectate` : 'Nimic selectat';
    }
    if (config.type === 'multi-tree') {
         const val = filter.value;
         const ids = Array.isArray(val) ? val : (val?.ids || []);
         const isExclude = val?.exclude || false;
         const c = ids.length;
         displayValue = c > 0 ? `${isExclude ? '≠ ' : ''}${c} categorii` : 'Toate categoriile';
    }
    if (config.type === 'number') {
         displayValue = `≤ ${filter.value || 0} RON`;
    }
    if (config.type === 'number-range') {
         const rv = filter.value as RangeValue;
         const hasMin = rv?.min !== undefined && rv.min !== '';
         const hasMax = rv?.max !== undefined && rv.max !== '';
         if (hasMin && hasMax) displayValue = `${rv.min} – ${rv.max}`;
         else if (hasMin) displayValue = `≥ ${rv.min}`;
         else if (hasMax) displayValue = `≤ ${rv.max}`;
         else displayValue = 'Orice';
    }

    return (
        <div className="relative group" ref={popRef}>
            {/* The Pill */}
            <div className={`flex items-center border rounded-lg text-sm font-medium transition-colors cursor-pointer ${filter.field === 'profitMarginWarning' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300 shadow-sm'}`}>
                <div onClick={() => setIsOpen(!isOpen)} className="px-3 py-1.5 flex items-center gap-2">
                     <span className="opacity-70 font-semibold text-xs uppercase">{config.label}:</span>
                     <span>{displayValue}</span>
                </div>
                <div className="border-l border-gray-200/50 hidden group-hover:block" />
                <button onClick={onRemove} className="px-2 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-r-lg transition-colors">
                     <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* The Editor Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 shadow-2xl rounded-xl z-[100] overflow-hidden flex flex-col max-h-[400px]">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                         <span className="text-xs font-bold uppercase text-gray-500">{config.label}</span>
                         <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>

                    <div className="p-2 overflow-y-auto flex-1">
                        {(config.type === 'text' || config.type === 'number') && (
                            <div className="p-2">
                                <input 
                                    autoFocus
                                    type={config.type} 
                                    className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={filter.value} 
                                    onChange={e => onUpdate(e.target.value)}
                                    placeholder={config.type === 'number' ? 'Ex: 100' : 'Scrie text...'}
                                />
                                {config.type === 'number' && (
                                    <p className="text-[10px] text-gray-500 mt-2 leading-tight">Arată doar produsele unde (Preț B2B - Cost Furnizor) este mai mic sau egal cu această sumă.</p>
                                )}
                            </div>
                        )}

                        {config.type === 'number-range' && (
                            <div className="p-3 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Min</label>
                                        <input 
                                            autoFocus
                                            type="number" 
                                            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                                            value={(filter.value as RangeValue)?.min || ''} 
                                            onChange={e => onUpdate({ ...filter.value, min: e.target.value })}
                                            placeholder="De la..."
                                        />
                                    </div>
                                    <span className="text-gray-400 font-bold mt-4">–</span>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Max</label>
                                        <input 
                                            type="number" 
                                            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                                            value={(filter.value as RangeValue)?.max || ''} 
                                            onChange={e => onUpdate({ ...filter.value, max: e.target.value })}
                                            placeholder="Până la..."
                                        />
                                    </div>
                                </div>
                                {config.description && (
                                    <p className="text-[10px] text-gray-500 leading-tight">{config.description}</p>
                                )}
                            </div>
                        )}

                        {config.type === 'select' && (
                            <div className="flex flex-col gap-1 p-1">
                                {config.options?.map(opt => (
                                    <button 
                                        key={opt.id}
                                        className={`flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg ${filter.value === opt.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}
                                        onClick={() => { onUpdate(opt.id); setIsOpen(false); }}
                                    >
                                        {opt.name}
                                        {filter.value === opt.id && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {config.type === 'boolean' && (
                            <div className="p-3">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                    <input 
                                        type="checkbox" 
                                        checked={Boolean(filter.value)}
                                        onChange={e => onUpdate(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-semibold text-gray-800">Activează filtrul</span>
                                </label>
                            </div>
                        )}

                        {config.type === 'multi-select' && (
                            <MultiSelectEditor 
                                items={suppliers.map((s:any) => ({ id: s.id, name: s.name }))} 
                                selectedIds={Array.isArray(filter.value) ? filter.value : (filter.value?.ids || [])} 
                                exclude={filter.value?.exclude || false}
                                onChange={(ids: number[]) => onUpdate({ ids, exclude: filter.value?.exclude || false })}
                                onToggleExclude={() => {
                                    const val = filter.value;
                                    const ids = Array.isArray(val) ? val : (val?.ids || []);
                                    onUpdate({ ids, exclude: !(val?.exclude || false) });
                                }}
                                searchPlaceholder="Caută furnizor..."
                            />
                        )}

                        {config.type === 'multi-tree' && (
                            <CategoryTreeEditor 
                                categories={wooCategories} 
                                selectedIds={Array.isArray(filter.value) ? filter.value : (filter.value?.ids || [])} 
                                exclude={filter.value?.exclude || false}
                                onChange={(ids: number[]) => onUpdate({ ids, exclude: filter.value?.exclude || false })}
                                onToggleExclude={() => {
                                    const val = filter.value;
                                    const ids = Array.isArray(val) ? val : (val?.ids || []);
                                    onUpdate({ ids, exclude: !(val?.exclude || false) });
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Editor Components
function MultiSelectEditor({ items, selectedIds, onChange, searchPlaceholder, exclude, onToggleExclude }: any) {
    const [search, setSearch] = useState('');
    const filtered = items.filter((i:any) => i.name.toLowerCase().includes(search.toLowerCase()));

    const toggle = (id: number) => {
         if (selectedIds.includes(id)) {
              onChange(selectedIds.filter((x:any) => x !== id));
         } else {
              onChange([...selectedIds, id]);
         }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 sticky top-0 bg-white border-b border-gray-100 z-10 flex flex-col gap-2">
                <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:ring-2 bg-gray-50 focus:bg-white" 
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-5 top-4.5" />
                {onToggleExclude && (
                    <div className="flex gap-1">
                        <button 
                            onClick={() => !exclude && onToggleExclude()} 
                            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-colors ${!exclude ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >Include</button>
                        <button 
                            onClick={() => exclude && onToggleExclude()} 
                            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-colors ${exclude ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >Exclude</button>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1 p-2">
                {filtered.map((item:any) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggle(item.id)}
                                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{item.name}</span>
                        </label>
                    );
                })}
                {filtered.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Nu am găsit rezultate.</p>}
            </div>
        </div>
    );
}

// Recursive Category Tree
function CategoryTreeEditor({ categories, selectedIds, onChange, exclude, onToggleExclude }: any) {
    const [search, setSearch] = useState('');

    const filteredCats = categories.filter((c:any) => c.name.toLowerCase().includes(search.toLowerCase()));

    const toggle = (id: number) => {
        if (selectedIds.includes(id)) {
             onChange(selectedIds.filter((x:any) => x !== id));
        } else {
             onChange([...selectedIds, id]);
        }
   };

    return (
        <div className="flex flex-col h-[300px]">
            <div className="p-2 sticky top-0 bg-white border-b border-gray-100 z-10 flex flex-col gap-2">
                <div className="relative">
                     <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                     <input 
                         type="text" 
                         className="w-full border rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:ring-2 bg-gray-50 focus:bg-white" 
                         placeholder="Caută categorie..."
                         value={search}
                         onChange={e => setSearch(e.target.value)}
                     />
                </div>
                {onToggleExclude && (
                    <div className="flex gap-1">
                        <button 
                            onClick={() => exclude && onToggleExclude()} 
                            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-colors ${!exclude ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >Include</button>
                        <button 
                            onClick={() => !exclude && onToggleExclude()} 
                            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-colors ${exclude ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >Exclude</button>
                    </div>
                )}
                {selectedIds.length > 0 && (
                     <div className="text-[10px] text-gray-500 flex justify-between items-center px-1">
                          <span>{selectedIds.length} {exclude ? 'excluse' : 'selectate'}</span>
                          <button onClick={() => onChange([])} className="text-blue-600 font-bold hover:underline">Deselectează Tot</button>
                     </div>
                )}
            </div>
            <div className="flex flex-col p-1 overflow-y-auto">
                {filteredCats.map((item:any) => {
                    const isSelected = selectedIds.includes(item.databaseId);
                    return (
                        <label key={item.databaseId} className={`flex items-start gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group ${isSelected && exclude ? 'bg-red-50' : ''}`}>
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggle(item.databaseId)}
                                className={`w-4 h-4 mt-0.5 rounded border-gray-300 focus:ring-blue-500 ${exclude ? 'text-red-600' : 'text-blue-600'}`}
                            />
                            <div className="flex flex-col">
                                <span className={`text-sm leading-tight ${isSelected ? (exclude ? 'font-bold text-red-700 line-through' : 'font-bold text-gray-900') : 'text-gray-700'}`}>{item.name}</span>
                                {item.parent?.node?.slug && <span className="text-[10px] text-gray-400 mt-0.5">Parent: {item.parent.node.slug}</span>}
                            </div>
                        </label>
                    );
                })}
                {filteredCats.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Fără rezultate.</p>}
            </div>
        </div>
    );
}
