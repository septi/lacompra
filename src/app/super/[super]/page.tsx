'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIXED_SUPERS } from '@/data/constants';
import { backupItems } from '@/data/items';

// Lista de nombres para autocompletado
const groceryItems: string[] = backupItems.map(b => b.item);

// Definir colores para supermercados (clases de Tailwind)
const superColors: { [key: string]: string } = {
  mercadona: 'bg-green-600',
  eroski: 'bg-red-600',
  lidl: 'bg-blue-700',
  gadis: 'bg-yellow-500',
  froiz: 'bg-red-600',
  otros: 'bg-gray-500',
};

// Función para obtener un color de fondo más suave basado en el color del supermercado
const getSofterColor = (superSlug: string): string => {
  // Mapeo de colores a versiones más suaves (HSL)
  const colorMap: { [key: string]: string } = {
    mercadona: 'hsl(142, 70%, 95%)', // Verde suave
    eroski: 'hsl(0, 70%, 95%)',      // Rojo suave
    lidl: 'hsl(220, 70%, 95%)',      // Azul suave
    gadis: 'hsl(50, 70%, 95%)',      // Amarillo suave
    froiz: 'hsl(0, 70%, 95%)',       // Rojo suave
    otros: 'hsl(0, 0%, 95%)',        // Gris suave
  };
  
  // Si es un supermercado "otros-X", usar el color de "otros"
  if (superSlug.startsWith('otros-')) {
    return colorMap.otros;
  }
  
  return colorMap[superSlug] || colorMap.otros;
};

// Helper to capitalize first letter or format 'otros-...' slugs
const formatSuperName = (slug: string): string => {
    if (!slug) return '';
    if (slug.startsWith('otros-')) {
        const name = slug.substring(6);
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return slug.charAt(0).toUpperCase() + slug.slice(1);
};

// Definir interfaces para los props
interface ListItem {
    id: string;
    nombre: string;
    cantidad: number;
    comprado?: boolean; // comprado flag, default false
    seccion?: string;  // sección asignada
}

interface SortableItemProps {
    id: string;
    item: ListItem;
    onUpdateItem: (id: string, updates: { cantidad?: number }) => void;
    onDeleteItem: (id: string) => void;
    onMoveItem: (id: string, targetSuper: string) => void;
    onToggleComprado: (id: string) => void;
    superSlug: string;
}

// Componente para cada elemento arrastrable
function SortableItem({ id, item, onUpdateItem, onDeleteItem, onMoveItem, onToggleComprado, superSlug }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Estado para controlar el menú de acciones
    const [showActions, setShowActions] = useState(false);
    
    return (
        <li 
            ref={setNodeRef} 
            style={style} 
            className="flex items-center p-2 my-2 bg-white rounded-md shadow-md transition-all duration-200 relative"
        >
            {/* Checkbox */}
            <input type="checkbox" checked={item.comprado} onChange={() => onToggleComprado(id)} className="mr-2 w-5 h-5 rounded-md border-gray-300 text-green-500 focus:ring-0 shadow-inner" />

            {/* Item Name - Ahora también es arrastrable */}
            <div 
                className={`flex-grow truncate font-medium ${item.comprado ? 'line-through text-gray-400' : 'text-gray-800'}`}
                style={{ maxWidth: 'calc(100% - 110px)' }}
            >
                {item.nombre}
            </div>

            {/* Cantidad */}
            <span className={`mx-2 px-2 font-bold rounded-full bg-gray-50 ${item.comprado ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.cantidad}</span>

            {/* Drag handle */}
            <div 
                {...attributes} 
                {...listeners} 
                style={{ touchAction: 'none' }}
                className="order-last ml-3 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-800"
                title="Arrastrar para reordenar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>

            {/* Botón de acciones */}
            <button
                onClick={() => setShowActions(!showActions)}
                className="ml-2 p-1 text-blue-600 hover:text-blue-800 focus:outline-none rounded-full hover:bg-blue-100 z-10"
                aria-label="Acciones"
                type="button"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </button>

            {/* Menú de acciones */}
            {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl z-50 p-2 border-0">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between p-2 border-b border-gray-100">
                        <span className="mr-2 text-gray-700">Cantidad:</span>
                        <div className="flex items-center">
                            <button
                                onClick={() => onUpdateItem(item.id, { cantidad: Math.max(1, item.cantidad - 1) })}
                                className="px-2 py-1 bg-red-500 text-white rounded-full shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                                disabled={item.cantidad <= 1}
                            >
                                -
                            </button>
                            <span className="mx-2 text-gray-700 font-medium">{item.cantidad}</span>
                            <button
                                onClick={() => onUpdateItem(item.id, { cantidad: item.cantidad + 1 })}
                                className="px-2 py-1 bg-green-500 text-white rounded-full shadow-sm hover:shadow-md transition-all"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Move to another list - No mostrar en tiendas de otros */}
                    {!superSlug.startsWith('otros-') && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">Mover a:</span>
                                <select 
                                    className="ml-2 p-1 border-0 rounded-lg shadow-[0_2px_5px_rgb(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            onMoveItem(item.id, e.target.value);
                                            setShowActions(false);
                                        }
                                    }}
                                    value=""
                                >
                                    <option value="" disabled>Seleccionar</option>
                                    {FIXED_SUPERS.filter(s => s !== superSlug && s !== 'otros').map(slug => (
                                        <option key={slug} value={slug}>{slug.charAt(0).toUpperCase() + slug.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}


export default function SuperListPage() {
    const params = useParams();
    const router = useRouter();
    const superSlug = params.super as string; // Get slug from URL

    const [list, setList] = useState<ListItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [movingItemId, setMovingItemId] = useState<string | null>(null); // State for moving item
    const [showPurchased, setShowPurchased] = useState(true);
    
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
            const mapped: ListItem[] = data.map((i: ListItem) => ({ ...i, comprado: i.comprado ?? false, seccion: i.seccion ?? '' }));
            // Agrupar y ordenar automáticamente: frutería, sin sección, congelados
            const fruteria = mapped.filter((item: ListItem) => item.seccion === 'frutería');
            const noneSection = mapped.filter((item: ListItem) => !item.seccion);
            const congelados = mapped.filter((item: ListItem) => item.seccion === 'congelados');
            const ordered = [...fruteria, ...noneSection, ...congelados];
            setList(ordered);
            // Persistir orden en backend
            await fetch(`/api/list/${superSlug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedList: ordered }),
            });
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
            // Determine section from backupItems
            const seccion = backupItems.find(b => b.item === nombre)?.seccion ?? '';
            const response = await fetch(apiBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, seccion }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al añadir artículo');
            }
            // Refresh list to apply ordering and fetch actual sections
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
        // Optimistic update
        setList(prev => prev.map(i => i.id === id ? { ...i, comprado: newComprado } : i));
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
            setList(prev => prev.map(i => i.id === id ? { ...i, comprado: item.comprado } : i));
        }
    };

    // Autocomplete logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewItemName(value);
        if (value.length > 0) {
            const normalize = (str: string) =>
                str.normalize('NFD').replace(/[ -]/g, '')?.toLowerCase() // remove diacritics
                    .normalize('NFD').replace(/[ -]/g, '');
            // actually diacritics removal
            const normalized = value.normalize('NFD').replace(/[ -]/g, '').toLowerCase();
            const filtered = groceryItems
                .filter(item => item.normalize('NFD').replace(/[ -]/g, '').toLowerCase().startsWith(normalized))
                .slice(0, 8);
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
    const handleUpdateItem = async (id: string, updates: { cantidad?: number }) => {
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
    const purchasedItems = list.filter(item => item.comprado);
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
                    <button 
                        onClick={fetchList}
                        className="block mx-auto mt-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                    >
                        Reintentar
                    </button>
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
                    <ul className="space-y-3">
                        {orderedUnpurchased.map((item) => (
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
                    <summary className="cursor-pointer font-semibold text-gray-800">Comprados ({purchasedItems.length})</summary>
                    <ul className="mt-2 space-y-3">
                        {purchasedItems.map(item => (
                            <li key={item.id} className="flex items-center p-2 my-2 bg-white rounded-md shadow-md">
                                <input type="checkbox" checked={item.comprado} onChange={() => handleToggleComprado(item.id)} className="mr-2 w-5 h-5 rounded-md border-gray-300 text-green-500 focus:ring-0 shadow-inner" />
                                <div className="flex-grow truncate line-through text-gray-400" style={{ maxWidth: 'calc(100% - 60px)' }}>
                                    {item.nombre}
                                </div>
                                <span className="mx-2 px-2 font-bold rounded-full bg-gray-50 line-through text-gray-400">{item.cantidad}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
            </>
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-3 md:p-5 lg:p-6" style={{
            background: `linear-gradient(145deg, ${getSofterColor(superSlug)}, white)`
        }}>
            <div className="flex justify-end mb-4">
                <button onClick={() => router.back()} className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none shadow-md">
                    ← Volver
                </button>
            </div>
            <h1 className="text-2xl font-bold mb-3 text-gray-800">{superDisplayName}</h1>
            
            {/* Formulario para agregar nuevos artículos */}
            <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={newItemName} 
                        onChange={handleInputChange}
                        onFocus={() => setShowSuggestions(suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                        placeholder="Agregar artículo" 
                        className="w-full p-2 text-gray-700 border-0 rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg"
                        autoComplete="off"
                    />
                    {showSuggestions && !superSlug.startsWith('otros-') && (
                        <ul className="absolute left-0 right-0 z-10 bg-white border-0 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                                <li
                                    key={suggestion}
                                    className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-800 transition-colors duration-150"
                                    onMouseDown={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 hover:shadow-lg focus:outline-none transition-all"
                >
                    Añadir
                </button>
            </form>
            
            {renderListItems()}
            
            {/* Botón para limpiar la lista */}
            <button 
                onClick={handleCleanList}
                className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded flex items-center justify-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar lista
            </button>
            
            {/* Botón para mover todos los artículos a otro super */}
            {!superSlug.startsWith('otros-') && (
            <div className="mt-4">
                <label className="text-gray-700 font-medium">Mover todo a:</label>
                <div className="relative inline-block">
                    <select 
                        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        onChange={async (e) => {
                            const targetSuper = e.target.value;
                            if (!targetSuper) return;
                            try {
                                for (const item of list) {
                                    await handleMoveItem(item.id, targetSuper);
                                }
                            } catch (error) {
                                console.error('Error al mover todos los elementos:', error);
                            }
                            e.target.value = '';
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Super</option>
                        {FIXED_SUPERS.filter(s => s !== superSlug && s !== 'otros').map(slug => (
                            <option key={slug} value={slug}>{slug.charAt(0).toUpperCase() + slug.slice(1)}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}