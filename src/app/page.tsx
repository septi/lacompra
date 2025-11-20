// Página principal: vista consolidada de todos los ítems de todas las listas
'use client'; // Mark this component as a Client Component

import { useState, useEffect } from 'react';
import PinModal from '@/components/PinModal'; // Import the modal component
import SupermarketCard from '@/components/SupermarketCard'; // Import the card component
import AllItemsList from '@/components/AllItemsList'; // Import the all items list component
import { FIXED_SUPERS } from '@/data/constants'; // Import fixed supermarket slugs

// Define colors for supermarkets (Tailwind classes)
const superColors: { [key: string]: string } = {
  eroski: 'bg-red-600 hover:bg-red-700',
  lidl: 'bg-blue-700 hover:bg-blue-800',
  gadis: 'bg-yellow-500 hover:bg-yellow-600',
  otros: 'bg-gray-500 hover:bg-gray-600',
  proximamente: 'bg-purple-600 hover:bg-purple-700',
  'cosas-varias': 'bg-pink-600 hover:bg-pink-700',
};

// Helper to capitalize each word and replace hyphens with spaces, except 'cosas-varias'
const capitalize = (s: string) => {
  if (s === 'cosas-varias') return 'Cosas varias';
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Se utiliza paleta fija, sin colores aleatorios

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true); // Start with modal potentially visible

  useEffect(() => {
    setIsClient(true);
    const pinOk = localStorage.getItem('pin_ok');
    if (pinOk === 'true') {
      setShowPinModal(false);
    }
  }, []);

  const handlePinVerified = () => {
    setShowPinModal(false);
  };

  if (!isClient) {
    // Optional: Show a loading skeleton or nothing during SSR/pre-hydration
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6" style={{ background: 'var(--gradient-top)' }}>
        {/* Basic loading indicator */}
        <div className="text-foreground">Cargando...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-5 bg-[var(--background)]">
      {showPinModal ? (
        <PinModal onPinVerified={handlePinVerified} />
      ) : (
        <main className="max-w-3xl mx-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FIXED_SUPERS.map((superSlug) => (
              <SupermarketCard
                key={superSlug}
                name={capitalize(superSlug)}
                slug={superSlug}
              />
            ))}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <AllItemsList />
          </div>
        </main>
      )}
    </div>
  );
}
