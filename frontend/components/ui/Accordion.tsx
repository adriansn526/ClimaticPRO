'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export default function Accordion({ title, children, defaultOpen = true }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-300 last:border-0 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left font-bold text-gray-900 group"
            >
                <span>{title}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        } group-hover:text-primary-700`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}
            >
                {children}
            </div>
        </div>
    );
}
