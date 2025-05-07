// Página para editar y gestionar los ítems fijos de autocompletado
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { backupItems } from '@/data/items';
import { ItemPredictivo } from '@/types/itemPredictivo';
import { Input, Button, Textarea, Select } from '@/components/ui';

export default function EditItemsPage() {
  const [itemPredictivos, setItemPredictivos] = useState<ItemPredictivo[]>([]);
  const [newItem, setNewItem] = useState('');
  const [editValues, setEditValues] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    setEditValues(Object.fromEntries(itemPredictivos.map(it => [it.nombre, it.nombre])));
  }, [itemPredictivos.length]);

  const handleEditChange = (oldNombre: string, value: string) => {
    setEditValues(vals => ({ ...vals, [oldNombre]: value }));
  };

  const handleEditAccept = async (oldNombre: string) => {
    const newNombre = editValues[oldNombre]?.trim();
    if (!newNombre || itemPredictivos.some(it => it.nombre !== oldNombre && it.nombre === newNombre)) {
      setEditValues(vals => ({ ...vals, [oldNombre]: oldNombre }));
      return;
    }
    const updated = itemPredictivos.map(it => it.nombre === oldNombre ? { ...it, nombre: newNombre } : it);
    setItemPredictivos(updated);
    setEditValues(vals => {
      const newVals = { ...vals };
      delete newVals[oldNombre];
      newVals[newNombre] = newNombre;
      return newVals;
    });
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedList: updated }),
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchItemPredictivos();
  }, []);

  const fetchItemPredictivos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/items');
      const data: ItemPredictivo[] = await res.json();
      console.log('API /api/items response:', data);
      const itemPredictivos: ItemPredictivo[] = data.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        seccion: i.seccion ?? ''
      }));
      itemPredictivos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setItemPredictivos(itemPredictivos);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los ítems.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    const updated = [...itemPredictivos, { id: crypto.randomUUID(), nombre: trimmed, seccion: '' }];
    updated.sort((a, b) => a.nombre.localeCompare(b.nombre));
    setItemPredictivos(updated);
    setNewItem('');
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedList: updated }),
    });
  };

  const handleDelete = async (toDelete: ItemPredictivo) => {
    const updated = itemPredictivos.filter(i => i.id !== toDelete.id);
    setItemPredictivos(updated);
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedList: updated }),
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { backupItems } = await import('@/data/items');
      // Genera lista con id, nombre y seccion
      const listWithIds: ItemPredictivo[] = backupItems.map(item => ({
        id: crypto.randomUUID(),
        nombre: item.item,
        seccion: item.seccion ?? ''
      }));
      await fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedList: listWithIds }),
      });
      await fetchItemPredictivos();
    } catch (err) {
      console.error(err);
      setError('Error al importar backup de ítems');
    } finally {
      setImporting(false);
    }
  };



  const handleSectionChange = async (toUpdate: ItemPredictivo, newSection: string) => {
    const updated = itemPredictivos.map(i => i.id === toUpdate.id ? { ...i, seccion: newSection } : i);
    setItemPredictivos(updated);
    try {
      const res = await fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedList: updated }),
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      console.log('Sección actualizada con éxito');
    } catch (err) {
      console.error('Error al actualizar sección:', err);
      setError('Error al actualizar sección');
    }
  };

  if (isLoading) return <div className="p-6 text-center">Cargando...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6" style={{ background: 'var(--gradient-bottom-left)' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Edición de Ítems Predictivos</h1>
        <div className="flex gap-2 items-center">

          <Link href="/" className="text-blue-500 hover:underline">← Volver</Link>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Nuevo ítem predictivo"
          className="flex-1"
        />
        <Button onClick={handleAdd}>
          Añadir
        </Button>
      </div>
      <ul className="space-y-2">
        {itemPredictivos.map(i => (
          <li key={i.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md space-x-4">
            <Textarea
              value={editValues[i.nombre] ?? i.nombre}
              onChange={(e) => handleEditChange(i.nombre, e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => handleEditAccept(i.nombre)}
              className="ml-1 p-1 rounded-full text-green-600 hover:bg-green-500 hover:text-white"
              aria-label="Aceptar cambio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
            <Select
              value={i.seccion}
              onChange={(e) => handleSectionChange(i, e.target.value)}
              className="text-xs min-w-0 w-auto max-w-[80px]"
              style={{ flex: 'none' }}
            >
              <option value="">—</option>
              <option value="frutería">Frutería</option>
              <option value="congelados">Congelados</option>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleDelete(i)}
              className="ml-1 p-1 rounded-full text-red-600 hover:bg-red-500 hover:text-white"
              aria-label="Eliminar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
