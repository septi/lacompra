// Página para gestionar tiendas personalizadas (Otros)
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button } from '@/components/ui';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import OtrosItemsList from '@/components/OtrosItemsList';

const API_URL = '/api/otros/tiendas';

export default function OtrosPage() {
  const router = useRouter();
  const { data: tiendas, error: swrError, isLoading, mutate } = useSWR<string[]>(API_URL, fetcher);

  const [newTiendaName, setNewTiendaName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  
  const handleAddTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTiendaName.trim()) return;

    setActionError(null);
    const originalTiendas = tiendas ? [...tiendas] : [];
    const slug = newTiendaName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      setActionError('Nombre de tienda inválido.');
      return;
    }

    const optimisticData = [...originalTiendas, slug].sort();
    mutate(optimisticData, false);
    setNewTiendaName('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTiendaName }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add tienda');
      }

      mutate();
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred while adding');
      mutate(originalTiendas, false);
    }
  };

  const handleDeleteTienda = async (tiendaSlug: string) => {
    setActionError(null);
    const originalTiendas = tiendas ? [...tiendas] : [];

    const optimisticData = originalTiendas.filter((t) => t !== tiendaSlug);
    mutate(optimisticData, false);

    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tiendaSlug }),
      });

      if (!response.ok && response.status !== 404) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete tienda');
      }

      mutate();
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred while deleting');
      mutate(originalTiendas, false);
    }
  };

  const displayError = actionError || (swrError ? swrError.message : null);

  return (
    <div className="container mx-auto p-6 max-w-lg min-h-screen" style={{ background: 'var(--gradient-top)' }}>
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm">Otras Tiendas</h1>
          <Button type="button" onClick={() => router.back()}>
            ← Volver
          </Button>
      </div>

      <form onSubmit={handleAddTienda} className="mb-8">
        <div className="flex gap-2 bg-white p-3 rounded-lg shadow-md">
          <Input
            type="text"
            value={newTiendaName}
            onChange={(e) => setNewTiendaName(e.target.value)}
            placeholder="Nombre de la nueva tienda"
            required
            autoComplete="off"
            className="flex-grow placeholder-gray-600 font-medium"
          />
          <Button type="submit" disabled={!newTiendaName.trim()}>
            Añadir
          </Button>
        </div>
      </form>

      {displayError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6 animate-fadeIn" role="alert">
              <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="block font-medium">{displayError}</span>
              </div>
          </div>
      )}

      {isLoading && (
          <div className="flex justify-center items-center py-8">
              <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-blue-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                          <div className="h-4 bg-blue-200 rounded"></div>
                          <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {!isLoading && tiendas && tiendas.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No hay tiendas personalizadas todavía.</p>
          <p className="text-gray-500 mt-2">Añade una nueva tienda usando el formulario superior.</p>
        </div>
      )}

      {!isLoading && tiendas && tiendas.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {tiendas.map((tiendaSlug) => {
              return (
                <div key={tiendaSlug} className="relative group">
                  <Link
                    href={`/super/otros-${tiendaSlug}`}
                    className="block p-6 rounded-lg shadow-md transition-transform hover:scale-105 text-center"
                    style={{ background: 'var(--gradient-right)', color: 'white' }}
                  >
                    <h2 className="text-2xl font-bold text-white text-center capitalize">
                      {tiendaSlug.replace(/-/g, ' ')}
                    </h2>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar la tienda ${tiendaSlug.replace(/-/g, ' ')}?`)) {
                        handleDeleteTienda(tiendaSlug);
                      }
                    }}
                    className="absolute top-2 right-2 text-white opacity-70 hover:opacity-100 text-xl"
                    aria-label={`Eliminar ${tiendaSlug}`}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Lista de todos los artículos de todas las tiendas */}
          <OtrosItemsList />
        </>
      )}
    </div>
  );
}
