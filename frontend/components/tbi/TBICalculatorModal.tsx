
'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface TBICalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    price: number;
    productName: string;
}

export default function TBICalculatorModal({ isOpen, onClose, price, productName }: TBICalculatorModalProps) {
    const [periods, setPeriods] = useState<number[]>([6, 12, 18, 24, 36, 48, 60]);
    const [selectedPeriod, setSelectedPeriod] = useState(24);
    const [tbiParams, setTbiParams] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && !tbiParams) {
            fetch('/api/tbi/params')
                .then(res => res.json())
                .then(data => {
                    setTbiParams(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, tbiParams]);

    if (!isOpen) return null;

    // PMT Calculation Logic derived from PHP plugin
    // PMT = (PV * rate) / (1 - (1 + rate)^-nper)
    // TBI uses complex dividers logic, we must replicate it.

    let monthlyRate = 0;
    let totalRepayable = 0;
    let interestRate = 0; // Display purpose
    let commission_val = 0; // Accessible in render

    if (tbiParams && !tbiParams.error) {
        // Determine parameters based on price and dividers
        // Logic from plugin functions.php tbiro_payment_fields
        const p = tbiParams;
        const priceVal = price; // using same naming as plugin logic

        let rate_val = 0;
        let insurance_val = 0;

        // Divider Logic matching functions.php
        const d1 = parseFloat(p.tbi_divider);
        const d2 = parseFloat(p.tbi_divider2);
        const d3 = parseFloat(p.tbi_divider3);
        const d4 = parseFloat(p.tbi_divider4);
        const d5 = parseFloat(p.tbi_divider5);

        // Check dividers enabled status (handle various types from JSON)
        const d2_is = p.tbi_divider2_is === true || p.tbi_divider2_is === '1' || p.tbi_divider2_is === 'true';
        const d3_is = p.tbi_divider3_is === true || p.tbi_divider3_is === '1' || p.tbi_divider3_is === 'true';
        const d4_is = p.tbi_divider4_is === true || p.tbi_divider4_is === '1' || p.tbi_divider4_is === 'true';
        const d5_is = p.tbi_divider5_is === true || p.tbi_divider5_is === '1' || p.tbi_divider5_is === 'true';

        // Helper to set params by suffix
        const setParams = (suffix: string) => {
            rate_val = parseFloat(p[`tbi_rate${suffix}`] || p.tbi_rate);
            insurance_val = parseFloat(p[`tbi_insurance${suffix}`] || p.tbi_insurance);
            commission_val = parseFloat(p[`tbi_commission${suffix}`] || p.tbi_commission);
        };

        // Cascading Tier Logic
        if (d5_is) {
            if (priceVal < d1) setParams('');
            else if (priceVal < d2) setParams('2');
            else if (priceVal < d3) setParams('3');
            else if (priceVal < d4) setParams('4');
            else if (priceVal < d5) setParams('5');
            else setParams('6');
        } else if (d4_is) {
            if (priceVal < d1) setParams('');
            else if (priceVal < d2) setParams('2');
            else if (priceVal < d3) setParams('3');
            else if (priceVal < d4) setParams('4');
            else setParams('5');
        } else if (d3_is) {
            if (priceVal < d1) setParams('');
            else if (priceVal < d2) setParams('2');
            else if (priceVal < d3) setParams('3');
            else setParams('4');
        } else if (d2_is) {
            if (priceVal < d1) setParams('');
            else if (priceVal < d2) setParams('2');
            else setParams('3');
        } else {
            // Default 2-tier or 1-tier
            if (priceVal < d1) setParams('');
            else setParams('2');
        }

        const r = (rate_val / 100) / 12;
        const n = selectedPeriod;

        // PV calculation: (price + comm) * (1 + insurance * months)
        // Note: In PHP logic, they pass -PV to PMT, but PV itself is calculated as above (simplified).
        const pv_effective = (priceVal + commission_val) * (1 + (insurance_val * n));

        if (r === 0) {
            monthlyRate = pv_effective / n;
        } else {
            monthlyRate = (pv_effective * r) / (1 - Math.pow(1 + r, -n));
        }

        totalRepayable = monthlyRate * n;
        interestRate = rate_val; // Annual percentage
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cumpara in Rate</h2>
                        <p className="text-gray-500 text-sm mt-1">{productName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TBI Branding */}
                            <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                        tbi
                                        <span className="text-orange-500">bank</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">TBI Bank</p>
                                        <p className="text-sm text-gray-600">Dobanda anuala: {interestRate}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-orange-600">{monthlyRate.toFixed(2)} Lei</p>
                                    <p className="text-xs text-gray-500">Rata lunara</p>
                                </div>
                            </div>

                            {/* Period Selection */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 block">Alege perioada de creditare:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {periods.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSelectedPeriod(p)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${selectedPeriod === p
                                                ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p} rate
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-6 space-y-3 border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Valoare produs:</span>
                                    <span className="font-medium">{price.toLocaleString('ro-RO')} Lei</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Dobanda:</span>
                                    <span className="font-medium">{interestRate}%</span>
                                </div>
                                {commission_val > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Comision analiză:</span>
                                        <span className="font-medium">{commission_val} Lei</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">

                                    <span className="text-gray-600">Perioada:</span>
                                    <span className="font-medium">{selectedPeriod} luni</span>
                                </div>
                                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total de rambursat:</span>
                                    <span className="text-xl font-bold text-gray-900">{totalRepayable.toFixed(2)} Lei</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Simplu si Rapid</p>
                                    <p>Selecteaza TBI Bank la finalizarea comenzii (Checkout) pentru a aplica 100% online.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t text-xs text-gray-500 text-center">
                    * Calculul este estimativ. Oferta finala se va stabili in urma analizei de risc de catre TBI Bank.
                </div>
            </div>
        </div>
    );
}
