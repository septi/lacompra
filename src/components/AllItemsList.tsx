// Componente que muestra una vista consolidada de todos los ítems de todas las listas
"use client";

import { useState, useEffect, useMemo } from 'react';
import { FIXED_SUPERS } from '@/data/constants';
import Link from 'next/link';

// Definir colores para los supermercados (mismos que en la página principal)
const superColors: { [key: string]: string } = {
  eroski: 'bg-red-600',
  lidl: 'bg-blue-700',
  gadis: 'bg-yellow-500',
  otros: 'bg-gray-500',
};

// Tipo para los elementos de la lista
interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  seccion?: string; // Sección asignada
  comprado?: boolean;
}

// Tipo para los elementos con información del supermercado
interface ItemWithSuper extends ListItem {
  superSlug: string;
  tiendaName?: string; // Para elementos de "otros"
  comprado?: boolean;
}

export default function AllItemsList() {
  const [allItems, setAllItems] = useState<ItemWithSuper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mostrar solo supermercados fijos seleccionados
  const allowedSuperSlugs = ['eroski','lidl','gadis'];

  // Función para obtener todos los elementos de todas las listas
  const fetchAllItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Obtener elementos de los supermercados fijos
      const superPromises = [...FIXED_SUPERS, 'otros'].map(async (superSlug) => {
        const response = await fetch(`/api/list/${superSlug}`);
        if (!response.ok) {
          console.warn(`Error al obtener la lista de ${superSlug}`);
          return [];
        }
        const items = await response.json();
        // Añadir información del supermercado a cada elemento
        return items
          .map((item: ListItem) => ({
            ...item,
            superSlug
          }));
      });
      
      // 2. Obtener tiendas personalizadas de "otros"
      let otrosTiendas: string[] = [];
      try {
        const tiendaResponse = await fetch('/api/otros/tiendas');
        if (tiendaResponse.ok) {
          otrosTiendas = await tiendaResponse.json();
        }
        
        // 3. Obtener elementos de cada tienda personalizada
        for (const tienda of otrosTiendas) {
          try {
            const tiendaSlug = `otros-${tienda}`;
            const response = await fetch(`/api/list/${tiendaSlug}`);
            if (response.ok) {
              const items = await response.json();
              // Añadir a los resultados con información de la tienda
              const tiendaItems = items
                .map((item: ListItem) => ({
                  ...item,
                  superSlug: 'otros',
                  tiendaName: tienda
                }));
              superPromises.push(Promise.resolve(tiendaItems));
            }
          } catch (err) {
            console.warn(`Error al obtener elementos de la tienda ${tienda}:`, err);
          }
        }
      } catch (err) {
        console.warn('Error al obtener tiendas personalizadas:', err);
        // Continuar sin tiendas personalizadas
      }
      
      // 4. Combinar todos los resultados
      const results = await Promise.all(superPromises);
      let combinedItems = results.flat();
      
      // 5. Ordenar por nombre
      combinedItems.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setAllItems(combinedItems);
    } catch (err) {
      console.error('Error al obtener todos los elementos:', err);
      setError('Error al cargar los elementos');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupar elementos por supermercado
  const groupedItems = useMemo(() => {
    const groups: Record<string, ItemWithSuper[]> = {};
    
    // Filtrar por no comprado y solo tiendas permitidas
    allItems
      .filter(item => !item.comprado && allowedSuperSlugs.includes(item.superSlug))
      .forEach(item => {
        // Crear una clave única para cada supermercado/tienda
        const key = item.superSlug === 'otros' && item.tiendaName 
          ? `otros-${item.tiendaName}` 
          : item.superSlug;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        
        groups[key].push(item);
      });
    
    // Convertir el objeto a un array ordenado por nombre de supermercado
    return Object.entries(groups).sort((a, b) => {
      // Poner los supermercados fijos primero, luego las tiendas personalizadas
      if (FIXED_SUPERS.includes(a[0]) && !FIXED_SUPERS.includes(b[0])) return -1;
      if (!FIXED_SUPERS.includes(a[0]) && FIXED_SUPERS.includes(b[0])) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [allItems]);

  useEffect(() => {
    fetchAllItems();
  }, []);

  // Formatear nombre de supermercado
  const formatSuperName = (slug: string) => slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groupedItems.map(([slug, items]) => (
          <div key={slug} className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <Link href={`/super/${slug}`}> 
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{formatSuperName(slug)}</h3>
                <span className="text-xs text-[var(--muted)]">{items.length} items</span>
              </div>
            </Link>
            <ul className="space-y-1.5">
              {items.map(item => (
                <li key={item.id} className="text-sm text-foreground overflow-hidden whitespace-nowrap truncate">
                  <Link href={`/super/${slug}`} className="block hover:underline overflow-hidden whitespace-nowrap truncate">
                    {item.nombre} <span className="text-[var(--muted)]">({item.cantidad})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Botón Edición predictivo */}
      <div className="flex justify-center pt-2">
        <Link href="/editar-items" className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:border-neutral-400 transition inline-flex items-center">
          Edición predictivo
        </Link>
      </div>
    </div>
  );
}
