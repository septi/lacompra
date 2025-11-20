// Página de lista de la compra para un supermercado concreto, con drag & drop y autocompletado
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIXED_SUPERS } from '@/data/constants';
import { backupItems } from '@/data/items';
import { Input, Button, Checkbox, Select, Textarea } from '@/components/ui';
import SortableItem from '@/components/SortableItem';
import type { ListItem } from '@/types';

// Lista de nombres para autocompletado
// Usamos items predictivos cargados una vez desde Redis
const groceryItems: string[] = [/* placeholder, se redefine en el componente */];

// Helper to format supermarket name: remove 'otros-' prefix, replace hyphens with spaces and capitalize words
const formatSuperName = (slug: string): string => {
  if (!slug) return '';
  let base = slug.startsWith('otros-') ? slug.slice(6) : slug;
  return base
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function SuperListPage() {
    const params = useParams();
    const router = useRouter();
    const superSlug = params.super as string; // Get slug from URL
    const isCosas = superSlug === 'cosas-varias';
    const isOtrosTienda = superSlug.startsWith('otros-');
    // Definir fuentes y objetivos permitidos para mover todos los artículos
    const ALLOWED_SOURCES_MOVE_ALL = ['eroski','lidl','gadis','proximamente'];
    const MOVE_TARGETS = ['eroski','lidl','gadis','proximamente'];
    const canMoveAll = ALLOWED_SOURCES_MOVE_ALL.includes(superSlug);

    const [list, setList] = useState<ListItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [movingItemId, setMovingItemId] = useState<string | null>(null); // State for moving item
    const [showPurchased, setShowPurchased] = useState(false);
    
    // Items predictivos desde Redis
    const [predictiveItems, setPredictiveItems] = useState<string[]>([]);
    useEffect(() => {
      async function fetchPredictivos() {
        try {
          const res = await fetch('/api/list/items');
          if (res.ok) {
            const data = await res.json() as Array<{ nombre: string }>;
            setPredictiveItems(data.map(i => i.nombre));
          }
        } catch (err) {
          console.error('Error fetching predictivos:', err);
        }
      }
      fetchPredictivos();
    }, []);
    // Usar predictiveItems para autocomplete
    const groceryItems = predictiveItems;

    // Definir los sensores para drag and drop fuera del renderizado condicional
    const sensors = useSensors(
        useSensor(TouchSensor),
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const superDisplayName = formatSuperName(superSlug);
    const apiBaseUrl = `/api/list/${superSlug}`;

    // Fetch list handler
    const fetchList = useCallback(async () => {
        if (!superSlug) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/list/${superSlug}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            // Parse JSON as ListItem array
            const data = (await response.json()) as ListItem[];
            // Map items and include default values
            const mapped: ListItem[] = data.map((i: ListItem) => ({
                ...i,
                comprado: i.comprado ?? false,
                seccion: i.seccion ?? '',
                link: i.link ?? '',
                compradoAt: i.compradoAt ?? null,
            }));
            // Agrupar y ordenar automáticamente: frutería, sin sección, congelados
            const fruteria = mapped.filter((item: ListItem) => item.seccion === 'frutería');
            const noneSection = mapped.filter((item: ListItem) => !item.seccion);
            const congelados = mapped.filter((item: ListItem) => item.seccion === 'congelados');
            const ordered = [...fruteria, ...noneSection, ...congelados];
            setList(ordered);
            // No persistir orden en backend automáticamente tras cada fetch
            // El PATCH debe lanzarse solo en drag & drop o acciones explícitas de reordenar/guardar
        } catch (err) {
            console.error('Error fetching list:', err);
            setError('Error al cargar la lista. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }, [superSlug]);

    // Clean list handler - soluciona problemas de elementos inválidos
    const handleCleanList = async () => {
        if (!superSlug) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/list/clean', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ superSlug }),
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Lista limpiada:', result);
            
            // Recargar la lista después de limpiarla
            fetchList();
        } catch (err) {
            console.error('Error limpiando la lista:', err);
            setError('Error al limpiar la lista. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (superSlug) {
            fetchList();
        }
    }, [superSlug, fetchList]);

    // Añadir artículo con un nombre explícito
    const addItem = async (nombre: string) => {
        setError(null);
        try {
            // Busca el ítem en backupItems ignorando tildes, mayúsculas y espacios
            // Así siempre usamos el nombre y la sección "oficiales" del backup para coherencia y debug
            const normalize = (str: string) =>
                str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const found = backupItems.find(
                b => normalize(b.item) === normalize(nombre)
            );
            const nombreFinal = found ? found.item : nombre;
            const seccion = found?.seccion ?? '';
            // Siempre guardamos el nombre y la sección tal como están en backupItems si existe
            const response = await fetch(apiBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreFinal, seccion }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al añadir artículo');
            }
            // Refresca la lista para asegurar orden y secciones correctas
            await fetchList();
            setNewItemName('');
        } catch (err: any) {
            setError(err.message || 'Error inesperado al añadir');
        }
    };

    // Handler para eliminar un ítem
    const handleDeleteItem = async (id: string) => {
        const prevList = [...list];
        setList(list => list.filter(item => item.id !== id));
        try {
            const response = await fetch(`/api/list/${superSlug}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: id }),
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            setList(prevList); // revertir
            alert('No se pudo eliminar el artículo. Inténtalo de nuevo.');
        }
    };

// Handle moving an item to another list
const handleMoveItem = async (itemId: string, destinationSuper: string) => {
if (!destinationSuper || destinationSuper === superSlug) return;
        
// Encontrar el elemento en la lista actual
const itemToMove = list.find(item => item.id === itemId);
if (!itemToMove) {
console.error('Item not found:', itemId);
return;
}
        
console.log(`Moving item ${itemId} (${itemToMove.nombre}) from ${superSlug} to ${destinationSuper}`);
        
// Store current list data for potential revert on error
const currentList = [...list];
        
        try {
            // 1. Delete from current list
            const deleteResponse = await fetch(`/api/list/${superSlug}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
            });
            
            if (!deleteResponse.ok) {
                throw new Error(`Error ${deleteResponse.status}: ${deleteResponse.statusText}`);
            }
            
            // 2. Add to destination list
            const addResponse = await fetch(`/api/list/${destinationSuper}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: itemToMove.nombre,
                    cantidad: itemToMove.cantidad,
                }),
            });

            if (!addResponse.ok) {
                throw new Error(`Error ${addResponse.status}: ${addResponse.statusText}`);
            }

            // Successfully moved!
            console.log(`Successfully moved item ${itemId} to ${destinationSuper}`);
            // Revalidate the current list data from the server to confirm
            // The destination list cache will be invalidated by the API route itself
            fetchList(); 

        } catch (error) {
          console.error('Error moving item:', error);
          // Revert optimistic update on error
          setList(currentList); // Put the original list back
          // Optionally show an error message to the user
          alert(`Error al mover el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    // Handler para finalizar el drag & drop
    async function handleDragEnd(event: import('@dnd-kit/core').DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return; // No hay cambio

        const oldIndex = list.findIndex(item => item.id === active.id);
        const newIndex = list.findIndex(item => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // Mover elemento localmente (optimista)
        const newList = arrayMove(list, oldIndex, newIndex);
        const previousList = list;
        setList(newList);

        // Persistir en backend
        try {
            const response = await fetch(`/api/list/${superSlug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedList: newList }),
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            // Revertir si falla
            setList(previousList);
            alert('No se pudo guardar el nuevo orden. Inténtalo de nuevo.');
        }
    }

    // Handler to mark item as purchased
    const handleToggleComprado = async (id: string) => {
        const item = list.find(i => i.id === id);
        if (!item) return;
        const newComprado = !item.comprado;
        const previousCompradoAt = item.compradoAt ?? null;
        const newTimestamp = newComprado ? Date.now() : null;
        // Optimistic update
        setList(prev => prev.map(i => i.id === id ? { ...i, comprado: newComprado, compradoAt: newTimestamp } : i));
        try {
            const response = await fetch(`/api/list/${superSlug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: id, comprado: newComprado }),
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
        } catch (error) {
            console.error('Error updating comprado:', error);
            // Revert on failure
            setList(prev => prev.map(i => i.id === id ? { ...i, comprado: item.comprado, compradoAt: previousCompradoAt } : i));
        }
    };

    // Autocomplete logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewItemName(value);
        if (!isCosas && value.length > 0) {
            const normalize = (str: string) =>
                str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const filtered = predictiveItems.filter(item => normalize(item).startsWith(normalize(value))).slice(0,8);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        setNewItemName(suggestion);
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
        await addItem(suggestion);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        await addItem(newItemName.trim());
    };

    // Handler for updating item quantity
    const handleUpdateItem = async (id: string, updates: { cantidad?: number; link?: string }) => {
        const prevList = [...list];
        setList(list => list.map(item => item.id === id ? { ...item, ...updates } : item));
        try {
            const response = await fetch(`/api/list/${superSlug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: id, ...updates }),
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            setList(prevList);
            alert('No se pudo actualizar el artículo. Inténtalo de nuevo.');
        }
    };

    // derive unpurchased and purchased lists
    const unpurchased = list.filter(item => !item.comprado);
    const normalizeKey = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

    const purchasedItems = useMemo(() => {
        const seen = new Set<string>();
        return list
            .filter(item => item.comprado)
            .sort((a, b) => (b.compradoAt ?? 0) - (a.compradoAt ?? 0))
            .filter(item => {
                const nameKey = normalizeKey(item.nombre ?? '');
                const sectionKey = normalizeKey(item.seccion ?? '');
                const key = `${nameKey}|${sectionKey}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }, [list]);
    // Agrupar sin comprar por sección
    const fruteria = unpurchased.filter(item => item.seccion === 'frutería');
    const noneSection = unpurchased.filter(item => !item.seccion);
    const congelados = unpurchased.filter(item => item.seccion === 'congelados');
    const orderedUnpurchased = [...fruteria, ...noneSection, ...congelados];

    // Render the list items
    const renderListItems = () => {
        if (isLoading) {
            return <div className="text-center p-4">Cargando...</div>;
        }
        
        if (error) {
            return (
                <div className="text-center p-4 text-red-500">
                    {error}
                    <Button onClick={fetchList} className="block mx-auto mt-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none">
                        Reintentar
                    </Button>
                </div>
            );
        }
        
        if (list.length === 0) {
            return (
                <div className="text-center p-8 text-gray-500">
                    <p>La lista está vacía.</p>
                    <p className="mt-2">Añade artículos usando el formulario superior.</p>
                </div>
            );
        }
        
        return (
            <>
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={orderedUnpurchased.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="space-y-1">
                        {orderedUnpurchased.map(item => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                item={item}
                                onUpdateItem={handleUpdateItem}
                                onDeleteItem={handleDeleteItem}
                                onMoveItem={handleMoveItem}
                                onToggleComprado={handleToggleComprado}
                                superSlug={superSlug}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
            {purchasedItems.length > 0 && (
                <details open={showPurchased} onToggle={e => setShowPurchased(e.currentTarget.open)} className="mt-6">
                    <summary className="cursor-pointer font-semibold" style={{ color: 'var(--foreground)' }}>Comprados ({purchasedItems.length})</summary>
                    <ul className="mt-2 space-y-3">
                        {purchasedItems.map(item => (
    <li key={item.id} className="flex items-center p-2 my-2 bg-white rounded-md shadow-md">
        <Checkbox
          id={`item-${item.id}`}
          checked={item.comprado}
          onChange={() => handleToggleComprado(item.id)}
          className="mr-3 cursor-pointer"
          aria-label={`Marcar ${item.nombre} como comprado`}
        />
        <label htmlFor={`item-${item.id}`} className="flex flex-grow items-center text-lg cursor-pointer line-through text-gray-400">{item.nombre}</label>
        <span className="mx-2 px-2 font-bold rounded-full bg-gray-50 line-through text-gray-400">{item.cantidad}</span>
        <Button
            onClick={() => handleDeleteItem(item.id)}
            className="ml-2 p-1 text-red-600 hover:text-white hover:bg-red-500 rounded-full transition-colors"
            aria-label="Eliminar comprado"
            type="button"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </Button>
    </li>
))}
                    </ul>
                </details>
            )}
            </>
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-5 bg-[var(--background)]">
            <div className="flex items-center justify-between mb-4">
                <Button onClick={() => router.back()} variant="outline" className="px-3 py-2 rounded-lg">
                    ← Volver
                </Button>
                <h1 className="cal-sans-regular text-xl font-semibold text-neutral-900">{superDisplayName}</h1>
            </div>
            
            {/* Formulario para agregar nuevos artículos */}
            <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
                <Input
                    ref={inputRef}
                    value={newItemName} 
                    onChange={handleInputChange}
                    onFocus={() => {
  if (newItemName.length === 0) {
    setSuggestions(groceryItems);
    setShowSuggestions(true);
  } else {
    setShowSuggestions(suggestions.length > 0);
  }
}}
                    onClick={() => {
  if (newItemName.length === 0) {
    setSuggestions(groceryItems);
    setShowSuggestions(true);
  } else {
    setShowSuggestions(suggestions.length > 0);
  }
}}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    placeholder="Agregar artículo" 
                    className="w-full p-2 text-gray-800 border border-[var(--border)] rounded-xl bg-[var(--surface)]"
                    autoComplete="off"
                    aria-label="Nuevo artículo"
                />
                {/* Autocomplete solo si no es cosas-variadas ni una tienda otros */}
                {!isCosas && !isOtrosTienda && showSuggestions && (
                    <ul className="absolute left-0 right-0 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-md mt-1 max-h-48 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion}
                                className="px-4 py-2 cursor-pointer hover:bg-[var(--surface-alt)] text-gray-800 transition-colors duration-150"
                                onMouseDown={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
                <Button type="submit">
                    Añadir
                </Button>
            </form>
            
            {renderListItems()}
            
            {/* Botón para mover todos los artículos a otro super */}
            {canMoveAll && (
              <div className="mt-6 flex items-center gap-3">
                <label className="text-sm text-[var(--muted)]">Mover todo a</label>
                <Select
                  onChange={async (e) => {
                    const targetSuper = e.target.value;
                    if (!targetSuper) return;
                    try {
                      for (const item of list.filter(i => !i.comprado)) {
                        await handleMoveItem(item.id, targetSuper);
                      }
                    } catch (error) {
                      console.error('Error al mover todos los elementos:', error);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-44"
                >
                  <option value="" disabled>Elegir</option>
                  {MOVE_TARGETS.filter(s => s !== superSlug).map(slug => (
                    <option key={slug} value={slug}>{slug.charAt(0).toUpperCase() + slug.slice(1)}</option>
                  ))}
                </Select>
              </div>
            )}
            {/* Botón para limpiar la lista */}
            <Button 
                onClick={() => {
                    if (window.confirm('¿Seguro que quieres borrar la lista? Esta acción no se puede deshacer.')) {
                        handleCleanList();
                    }
                }}
                variant="outline"
                className="mt-4 px-3 py-2 text-red-600 hover:text-red-700 flex items-center justify-center rounded-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Borrar lista
            </Button>
        </div>
    );
}
