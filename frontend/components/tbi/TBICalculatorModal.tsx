
'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Info } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

interface TBICalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    price: number;
    productName: string;
}

/**
 * Exact replica of PHP tbiro_PMT function from TBI WooCommerce plugin v3.3.9
 * PHP: return (-$fv - $pv * pow(1 + $rate, $nper)) / (1 + $rate * $type) / ((pow(1 + $rate, $nper) - 1) / $rate);
 */
function tbiro_PMT(rate: number, nper: number, pv: number, fv: number = 0, type: number = 0): number {
    return (-fv - pv * Math.pow(1 + rate, nper)) / (1 + rate * type) / ((Math.pow(1 + rate, nper) - 1) / rate);
}

/**
 * Resolve TBI tier parameters based on price and divider configuration.
 * Exact replica of the cascading divider logic from functions.php lines 243-384.
 */
function resolveTBITier(p: any, priceVal: number) {
    const d1 = parseFloat(p.tbi_divider);
    const d2 = parseFloat(p.tbi_divider2);
    const d3 = parseFloat(p.tbi_divider3);
    const d4 = parseFloat(p.tbi_divider4);
    const d5 = parseFloat(p.tbi_divider5);

    const d2_is = p.tbi_divider2_is === true || p.tbi_divider2_is === '1' || p.tbi_divider2_is === 'true';
    const d3_is = p.tbi_divider3_is === true || p.tbi_divider3_is === '1' || p.tbi_divider3_is === 'true';
    const d4_is = p.tbi_divider4_is === true || p.tbi_divider4_is === '1' || p.tbi_divider4_is === 'true';
    const d5_is = p.tbi_divider5_is === true || p.tbi_divider5_is === '1' || p.tbi_divider5_is === 'true';

    // Helper to extract params by suffix (matching PHP)
    const getParams = (suffix: string) => ({
        rate: parseFloat(p[`tbi_rate${suffix}`] || '0'),
        commission: parseFloat(p[`tbi_commission${suffix}`] || '0'),
        insurance: parseFloat(p[`tbi_insurance${suffix}`] || '0'),
        months: parseInt(p[`tbi_months${suffix}`] || '24', 10),
    });

    // Cascading tier logic - exact match of PHP divider cascade
    if (d5_is) {
        if (priceVal < d1) return getParams('');
        else if (priceVal >= d1 && priceVal < d2) return getParams('2');
        else if (priceVal >= d2 && priceVal < d3) return getParams('3');
        else if (priceVal >= d3 && priceVal < d4) return getParams('4');
        else if (priceVal >= d4 && priceVal < d5) return getParams('5');
        else return getParams('6');
    } else if (d4_is) {
        if (priceVal < d1) return getParams('');
        else if (priceVal >= d1 && priceVal < d2) return getParams('2');
        else if (priceVal >= d2 && priceVal < d3) return getParams('3');
        else if (priceVal >= d3 && priceVal < d4) return getParams('4');
        else return getParams('5');
    } else if (d3_is) {
        if (priceVal < d1) return getParams('');
        else if (priceVal >= d1 && priceVal < d2) return getParams('2');
        else if (priceVal >= d2 && priceVal < d3) return getParams('3');
        else return getParams('4');
    } else if (d2_is) {
        if (priceVal < d1) return getParams('');
        else if (priceVal >= d1 && priceVal < d2) return getParams('2');
        else return getParams('3');
    } else {
        if (priceVal < d1) return getParams('');
        else return getParams('2');
    }
}

/**
 * Calculate the monthly installment using exact TBI PHP logic.
 * Returns { monthlyRate, totalRepayable, interestRate, commission, months, insurance }
 */
export function calculateTBIRate(tbiParams: any, price: number) {
    if (!tbiParams || tbiParams.error) {
        return null;
    }

    const tier = resolveTBITier(tbiParams, price);
    let { rate, commission, insurance, months } = tier;

    // PHP fallback: if rate is 0, force to 1 (line 386-388 in functions.php)
    if (rate === 0) {
        rate = 1;
    }

    // Calculate PMT exactly as PHP does (line 390):
    // $tbiro_mesecna = $this->tbiro_PMT(($tbi_rate / 100) / 12, $tbi_months, -($price + $commission) * (1 + $insurance * $months));
    const r = (rate / 100) / 12;
    const pv = -(price + commission) * (1 + insurance * months);
    const monthlyRate = tbiro_PMT(r, months, pv);

    const totalRepayable = monthlyRate * months;

    return {
        monthlyRate,
        totalRepayable,
        interestRate: rate,
        commission,
        insurance,
        months,
    };
}

export default function TBICalculatorModal({ isOpen, onClose, price, productName }: TBICalculatorModalProps) {
    const posthog = usePostHog();
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

    const result = calculateTBIRate(tbiParams, price);

    const monthlyRate = result?.monthlyRate ?? 0;
    const totalRepayable = result?.totalRepayable ?? 0;
    const interestRate = result?.interestRate ?? 0;
    const commission = result?.commission ?? 0;
    const insurance = result?.insurance ?? 0;
    const months = result?.months ?? 24;
    const totalInterest = totalRepayable - price;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cumpără în Rate</h2>
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
                            {/* TBI Branding + Main Rate Display */}
                            <div className="flex items-center justify-between bg-orange-50 p-5 rounded-xl border border-orange-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                        tbi
                                        <span className="text-orange-500">bank</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">TBI Bank</p>
                                        <p className="text-sm text-gray-600">{months} rate lunare</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-orange-600">{monthlyRate.toFixed(2)} Lei</p>
                                    <p className="text-xs text-gray-500 font-medium">per lună</p>
                                </div>
                            </div>

                            {/* Breakdown Details */}
                            <div className="bg-gray-50 rounded-xl p-6 space-y-3 border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Valoare produs:</span>
                                    <span className="font-medium">{price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lei</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Dobânda anuală (DAE):</span>
                                    <span className="font-medium">{interestRate}%</span>
                                </div>
                                {commission > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Comision analiză dosar:</span>
                                        <span className="font-medium">{commission.toFixed(2)} Lei</span>
                                    </div>
                                )}
                                {insurance > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Asigurare (per lună):</span>
                                        <span className="font-medium">{(insurance * 100).toFixed(1)}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Perioadă:</span>
                                    <span className="font-medium">{months} luni</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Cost total credit:</span>
                                    <span className="font-medium text-gray-700">{totalInterest > 0 ? `+${totalInterest.toFixed(2)} Lei` : '0 Lei'}</span>
                                </div>
                                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total de rambursat:</span>
                                    <span className="text-xl font-bold text-gray-900">{totalRepayable.toFixed(2)} Lei</span>
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Simplu și Rapid</p>
                                    <p>Selectează TBI Bank la finalizarea comenzii (Checkout) pentru a aplica 100% online.</p>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="flex gap-2 items-start text-xs text-gray-400">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Perioada de creditare și condițiile financiare sunt stabilite de TBI Bank în funcție de valoarea comenzii. Rata afișată este calculată conform parametrilor actuali furnizați de TBI Bank.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t text-xs text-gray-500 text-center">
                    * Calculul este estimativ. Oferta finală se va stabili în urma analizei de risc de către TBI Bank.
                </div>
            </div>
        </div>
    );
}
