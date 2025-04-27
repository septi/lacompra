// Componente que muestra una vista consolidada de todos los ítems de todas las listas
"use client";

import { useState, useEffect, useMemo } from 'react';
import { FIXED_SUPERS } from '@/data/constants';
import Link from 'next/link';

// Definir colores para los supermercados (mismos que en la página principal)
const superColors: { [key: string]: string } = {
  mercadona: 'bg-green-600',
  eroski: 'bg-red-600',
  lidl: 'bg-blue-700',
  gadis: 'bg-yellow-500',
  froiz: 'bg-red-600',
  otros: 'bg-gray-500',
};

// Tipo para los elementos de la lista
interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  seccion?: string; // Sección asignada
}

// Tipo para los elementos con información del supermercado
interface ItemWithSuper extends ListItem {
  superSlug: string;
  tiendaName?: string; // Para elementos de "otros"
}

export default function AllItemsList() {
  const [allItems, setAllItems] = useState<ItemWithSuper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    allItems.forEach(item => {
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

  // Renderizar un botón para el supermercado
  const renderSuperButton = (superSlug: string, tiendaName?: string) => {
    const color = superColors[superSlug] || superColors.otros;
    let displayName;
    
    if (superSlug === 'otros' && tiendaName) {
      // Para tiendas personalizadas, mostrar el nombre de la tienda
      displayName = tiendaName.charAt(0).toUpperCase() + tiendaName.slice(1);
    } else {
      // Para supermercados fijos, mostrar el nombre formateado
      displayName = superSlug.charAt(0).toUpperCase() + superSlug.slice(1);
    }
    
    return (
      <span 
        className={`${color} text-white font-bold rounded-lg px-4 py-2 text-md inline-block w-full text-center shadow-sm transition-all duration-200 hover:shadow transform hover:scale-105`}
      >
        {displayName}
      </span>
    );
  };

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
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6 animate-fadeIn" role="alert">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="block font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center drop-shadow-sm">Todos los Artículos</h2>
 
        {allItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">No hay elementos en ninguna lista</p>
            <p className="text-gray-500 mt-2">Añade artículos a tus listas para verlos aquí.</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            {groupedItems.map(([key, items]) => {
              // Determinar si es un supermercado fijo o una tienda personalizada
              const isTiendaPersonalizada = key.startsWith('otros-');
              const superSlug = isTiendaPersonalizada ? 'otros' : key;
              const tiendaName = isTiendaPersonalizada ? key.substring(6) : undefined;
              const href = `/super/${superSlug}${tiendaName ? `-${tiendaName}` : ''}`;
              
              return (
                <div key={key} className="mb-8 bg-white rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
                  {/* Encabezado del supermercado */}
                  <Link href={href} className="block mb-3">
                    {renderSuperButton(superSlug, tiendaName)}
                  </Link>
                  
                  {/* Lista de elementos */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
  {items.map(item => (
    <Link 
      key={`${key}-${item.id}`}
      href={href}
      className="text-gray-800 hover:text-blue-600 px-2 py-1 rounded flex items-center min-h-8 transition-all duration-150 border border-transparent hover:bg-blue-50 hover:border-blue-100"
      style={{ fontSize: '1rem', lineHeight: '1.2', minHeight: '2.25rem' }}
    >
      <span className="flex-1 font-medium truncate">
        {item.nombre}
      </span>
    </Link>
  ))}
</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-center mb-6">
        <Link href="/editar-items" className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition inline-block">
          Edición predictivo
        </Link>
      </div>
    </>
  );
}
