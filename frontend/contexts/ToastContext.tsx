'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto dismiss
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <X className="w-5 h-5 text-red-500" />, // Using X for error icon too, but we can change if needed
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    };

    const bgColors = {
        success: 'bg-white border-green-500',
        error: 'bg-white border-red-500',
        info: 'bg-white border-blue-500',
        warning: 'bg-white border-orange-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-lg shadow-lg border-l-4 flex items-center gap-3 ${bgColors[toast.type]}`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
