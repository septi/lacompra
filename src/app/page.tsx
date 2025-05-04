// Página principal: vista consolidada de todos los ítems de todas las listas
'use client'; // Mark this component as a Client Component

import { useState, useEffect } from 'react';
import PinModal from '@/components/PinModal'; // Import the modal component
import SupermarketCard from '@/components/SupermarketCard'; // Import the card component
import AllItemsList from '@/components/AllItemsList'; // Import the all items list component
import { FIXED_SUPERS } from '@/data/constants'; // Import fixed supermarket slugs

// Define colors for supermarkets (Tailwind classes)
const superColors: { [key: string]: string } = {
  mercadona: 'bg-green-600 hover:bg-green-700',
  eroski: 'bg-red-600 hover:bg-red-700',
  lidl: 'bg-blue-700 hover:bg-blue-800',
  gadis: 'bg-yellow-500 hover:bg-yellow-600',
  froiz: 'bg-red-600 hover:bg-red-700',
  otros: 'bg-gray-500 hover:bg-gray-600',
  proximamente: 'bg-purple-600 hover:bg-purple-700',
  'cosas-varias': 'bg-pink-600 hover:bg-pink-700',
};

// Función para generar un color aleatorio suave
const getRandomPastelColor = () => {
  // Generar colores pastel (más claros)
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 90%)`; // Saturación al 70%, luminosidad al 90% para colores suaves
};

// Helper to capitalize each word and replace hyphens with spaces, except 'cosas-varias'
const capitalize = (s: string) => {
  if (s === 'cosas-varias') return 'Cosas varias';
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Función para generar un color aleatorio suave
export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true); // Start with modal potentially visible
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    setIsClient(true);
    const pinOk = localStorage.getItem('pin_ok');
    if (pinOk === 'true') {
      setShowPinModal(false);
    }
    
    // Establecer un color de fondo aleatorio
    setBgColor(getRandomPastelColor());
  }, []);

  const handlePinVerified = () => {
    setShowPinModal(false);
  };

  if (!isClient) {
    // Optional: Show a loading skeleton or nothing during SSR/pre-hydration
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
        {/* Basic loading indicator */}
        <div className="text-gray-500">Cargando...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundColor: bgColor }}>
      {showPinModal ? (
        <PinModal onPinVerified={handlePinVerified} />
      ) : (
        <main className="max-w-4xl mx-auto">
          {/* Espacio superior */}
          <div className="mb-6"></div>
          
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            {FIXED_SUPERS.map((superSlug) => (
              <SupermarketCard
                key={superSlug}
                name={capitalize(superSlug)}
                slug={superSlug}
                colorClass={superColors[superSlug] || superColors.otros}
              />
            ))}
          </div>

          {/* Lista de todos los elementos de todas las listas (ahora al final) */}
          <AllItemsList />
        

        </main>
      )}
    </div>
  );
}
