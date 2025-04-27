// Componente para mostrar y gestionar ítems de tiendas personalizadas (Otros)
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Tipo para los elementos de la lista
interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  comprado: boolean;
}

// Tipo para los elementos con información de la tienda
interface ItemWithTienda extends ListItem {
  tiendaSlug: string;
}

export default function OtrosItemsList() {
  const [allItems, setAllItems] = useState<ItemWithTienda[]>([]);
  const [tiendas, setTiendas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Objeto para almacenar los colores de las tiendas
  const [tiendaColors, setTiendaColors] = useState<Record<string, string>>({});

  // Función para obtener el color de una tienda desde localStorage
  const getTiendaColor = (tiendaSlug: string) => {
    if (tiendaColors[tiendaSlug]) {
      return tiendaColors[tiendaSlug];
    }
    
    // Intentar obtener el color de localStorage
    try {
      const savedColor = localStorage.getItem(`tiendaColor_${tiendaSlug}`);
      if (savedColor) {
        // Actualizar el estado con el color guardado
        setTiendaColors(prev => ({
          ...prev,
          [tiendaSlug]: savedColor
        }));
        return savedColor;
      }
    } catch (e) {
      console.warn('Error al acceder a localStorage:', e);
    }
    
    // Color por defecto si no se encuentra
    return 'bg-gray-500 hover:bg-gray-600';
  };

  // Función para obtener todas las tiendas personalizadas
  const fetchTiendas = async () => {
    try {
      const response = await fetch('/api/otros/tiendas');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const tiendaList = await response.json();
      setTiendas(tiendaList);
      return tiendaList;
    } catch (err) {
      console.error('Error al obtener tiendas:', err);
      setError('Error al cargar las tiendas');
      return [];
    }
  };

  // Función para obtener todos los elementos de todas las tiendas
  const fetchAllItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Obtener la lista de tiendas
      const tiendaList = await fetchTiendas();
      
      // 2. Obtener elementos de cada tienda
      const tiendaPromises = tiendaList.map(async (tiendaSlug: string) => {
        try {
          const response = await fetch(`/api/list/otros-${tiendaSlug}`);
          if (!response.ok) {
            console.warn(`Error al obtener la lista de ${tiendaSlug}`);
            return [];
          }
          
          const items = await response.json();
          // Añadir información de la tienda a cada elemento y filtrar los comprados
          return items
            .filter((item: ListItem) => !item.comprado)
            .map((item: ListItem) => ({
              ...item,
              tiendaSlug
            }));
        } catch (err) {
          console.warn(`Error al obtener elementos de ${tiendaSlug}:`, err);
          return [];
        }
      });
      
      // 3. Combinar todos los resultados
      const results = await Promise.all(tiendaPromises);
      const combinedItems = results.flat();
      
      setAllItems(combinedItems);
    } catch (err) {
      console.error('Error al obtener todos los elementos:', err);
      setError('Error al cargar los elementos');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupar elementos por tienda
  const groupedItems = useMemo(() => {
    const groups: Record<string, ItemWithTienda[]> = {};
    
    allItems.forEach(item => {
      if (!groups[item.tiendaSlug]) {
        groups[item.tiendaSlug] = [];
      }
      
      groups[item.tiendaSlug].push(item);
    });
    
    // Convertir el objeto a un array ordenado por nombre de tienda
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allItems]);

  useEffect(() => {
    fetchAllItems();
  }, []);

  // Renderizar un botón para la tienda
  const renderTiendaButton = (tiendaSlug: string) => {
    const color = getTiendaColor(tiendaSlug);
    const displayName = tiendaSlug.charAt(0).toUpperCase() + tiendaSlug.slice(1).replace(/-/g, ' ');
    
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

  if (groupedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 text-lg">No hay elementos en ninguna tienda personalizada</p>
        <p className="text-gray-500 mt-2">Añade artículos a tus tiendas personalizadas para verlos aquí.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center drop-shadow-sm">Artículos en Tiendas Personalizadas</h2>
      
      <div className="max-w-xl mx-auto">
        {groupedItems.map(([tiendaSlug, items]) => {
          const href = `/super/otros-${tiendaSlug}`;
          
          return (
            <div key={tiendaSlug} className="mb-8 bg-white rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
              {/* Encabezado de la tienda */}
              <Link href={href} className="block mb-3">
                {renderTiendaButton(tiendaSlug)}
              </Link>
              
              {/* Lista de elementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {items.map(item => (
                  <Link 
                    key={item.id}
                    href={href}
                    className="text-gray-800 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 flex items-center justify-between transition-all duration-200 border border-transparent hover:border-blue-100"
                  >
                    <span className="font-medium">
                      {item.nombre}
                    </span>
                    {/* Cantidad */}
                    {item.cantidad > 1 && (
                      <span className="text-gray-700 font-bold ml-2 bg-gray-100 px-2 py-1 rounded-full text-sm">
                        ×{item.cantidad}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
