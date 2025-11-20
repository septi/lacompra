'use client';

import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Checkbox, Select, Textarea } from '@/components/ui';
import type { SortableItemProps } from '@/types';

// Helper to format supermarket name
const formatSuperName = (slug: string): string => {
  if (!slug) return '';
  const base = slug.startsWith('otros-') ? slug.slice(6) : slug;
  return base.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function SortableItem({ id, item, onUpdateItem, onDeleteItem, onMoveItem, onToggleComprado, superSlug }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const [showActions, setShowActions] = useState(false);
  const [linkValue, setLinkValue] = useState<string>(item.link || '');
  const canMove = ['eroski','lidl','gadis','proximamente'].includes(superSlug);
  const containerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    if (showActions) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <li
      ref={(node) => { setNodeRef(node); containerRef.current = node; }}
      style={style}
      className="flex items-center px-3 py-2 my-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm transition-all duration-200 relative"
    >
      <label htmlFor={`item-${id}`} className="flex flex-grow items-center text-base cursor-pointer text-neutral-900">
        <Checkbox
          id={`item-${id}`}
          checked={item.comprado}
          onChange={() => onToggleComprado(id)}
          className="mr-2 cursor-pointer"
          aria-label={`Marcar ${item.nombre} como comprado`}
        />
        {item.nombre}
      </label>

      {(superSlug.startsWith('otros-') || superSlug === 'cosas-varias') && item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: 'var(--light-coral)', color: 'white' }}
          className="px-2 py-1 rounded-full"
          aria-label={`Abrir enlace de ${item.nombre}`}
        >
          Enlace
        </a>
      )}

      <span className={`mx-2 px-2 font-bold rounded-full bg-gray-50 ${item.comprado ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.cantidad}</span>

      <div
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
        className="order-last ml-2 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-800"
        title="Arrastrar para reordenar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <Button
        onClick={() => setShowActions(!showActions)}
        className="ml-1 p-1 text-blue-600 hover:text-blue-800 focus:outline-none rounded-full hover:bg-blue-100 z-10"
        aria-label="Acciones"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </Button>

      {showActions && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl z-50 p-2 border-0">
          <div className="flex items-center justify-between p-2 border-b border-gray-100">
            <span className="mr-2 text-gray-700">Cantidad:</span>
            <div className="flex items-center">
              <Button
                onClick={() => onUpdateItem(item.id, { cantidad: Math.max(1, item.cantidad - 1) })}
                variant="outline"
                className="px-2 py-1 text-neutral-900 rounded-lg shadow-none hover:bg-neutral-100 disabled:opacity-50 transition-all"
                disabled={item.cantidad <= 1}
              >
                -
              </Button>
              <span className="mx-2 text-gray-800 font-medium">{item.cantidad}</span>
              <Button
                onClick={() => onUpdateItem(item.id, { cantidad: item.cantidad + 1 })}
                className="px-2 py-1 rounded-lg shadow-none"
              >
                +
              </Button>
            </div>
          </div>

          {canMove && (
            <div className="p-2 border-t border-gray-100">
              <label className="text-gray-700 font-medium text-sm">Mover a:</label>
              <Select
                defaultValue=""
                onChange={(e) => { onMoveItem(item.id, e.target.value); setShowActions(false); }}
                className="mt-1 w-full"
              >
                <option value="" disabled>Super</option>
                {['eroski','lidl','gadis','proximamente']
                  .filter(s => s !== superSlug)
                  .map(slug => (
                    <option key={slug} value={slug}>{formatSuperName(slug)}</option>
                  ))}
              </Select>
            </div>
          )}

          {(superSlug.startsWith('otros-') || superSlug === 'cosas-varias') && (
            <div className="p-2 border-t border-gray-100 flex items-center space-x-2">
              <Textarea
                id={`link-${item.id}`}
                value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                placeholder="URL del item"
                className="flex-grow p-1 border border-gray-300 rounded focus:outline-none text-gray-900 text-sm"
              />
              <Button
                onClick={() => { onUpdateItem(item.id, { link: linkValue }); setShowActions(false); }}
                className="px-2 py-1 text-white rounded text-sm"
                style={{ background: 'var(--yinmn-blue-dark)' }}
                type="button"
              >Guardar</Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
