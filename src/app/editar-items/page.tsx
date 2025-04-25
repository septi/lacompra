"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { backupItems } from '@/data/items';

interface EditItem {
  item: string;
  seccion: string;
}

export default function EditItemsPage() {
  const [items, setItems] = useState<EditItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/items');
      const data: EditItem[] = await res.json();
      data.sort((a, b) => a.item.localeCompare(b.item));
      setItems(data);
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
    const updated = [...items, { item: trimmed, seccion: '' }];
    updated.sort((a, b) => a.item.localeCompare(b.item));
    setItems(updated);
    setNewItem('');
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedList: updated }),
    });
  };

  const handleDelete = async (toDelete: EditItem) => {
    const updated = items.filter(i => i.item !== toDelete.item);
    setItems(updated);
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedList: updated }),
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedList: backupItems }),
      });
      await fetchItems();
    } catch (err) {
      console.error(err);
      setError('Error al importar backup de ítems');
    } finally {
      setImporting(false);
    }
  };

  const handleSectionChange = async (toUpdate: EditItem, newSection: string) => {
    console.log('Cambiando sección de', toUpdate.item, 'a', newSection);
    const updated = items.map(i => i.item === toUpdate.item ? { ...i, seccion: newSection } : i);
    setItems(updated);
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
    <div className="max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Edición de Ítems</h1>
        <Link href="/" className="text-blue-500 hover:underline">← Volver</Link>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Nuevo ítem"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none text-gray-800 placeholder-gray-500"
        />
        <button
          onClick={handleAdd}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Añadir
        </button>
      </div>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.item} className="flex items-center justify-between p-2 bg-gray-50 rounded-md space-x-4">
            <span className="truncate text-gray-800 flex-1">{i.item}</span>
            <select
              value={i.seccion}
              onChange={e => handleSectionChange(i, e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-gray-800"
            >
              <option value="">Ninguna</option>
              <option value="congelados">Congelados</option>
              <option value="frutería">Frutería</option>
            </select>
            <button
              onClick={() => handleDelete(i)}
              className="text-red-500 hover:text-red-700"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
