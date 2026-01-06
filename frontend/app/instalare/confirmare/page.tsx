import { Suspense } from 'react';
import { Metadata } from 'next';
import ConfirmationContent from '@/components/installation/ConfirmationContent';

export const metadata: Metadata = {
  title: 'Confirmare Programare | ClimaticPro',
  description: 'Programarea ta a fost confirmată cu succes. Vei primi un email cu detaliile instalării.',
};

export default function ConfirmarePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
