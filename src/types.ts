// Tipos compartidos para la lista y el componente SortableItem
export interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  comprado?: boolean;
  seccion?: string;
  link?: string;
}

export interface SortableItemProps {
  id: string;
  item: ListItem;
  onUpdateItem: (id: string, updates: { cantidad?: number; link?: string }) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (id: string, targetSuper: string) => void;
  onToggleComprado: (id: string) => void;
  superSlug: string;
}
