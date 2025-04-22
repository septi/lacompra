import { kv } from '@vercel/kv';

// Funciones para gestionar las tiendas personalizadas en "otros"
export async function getOtrosTiendas(): Promise<string[]> {
  try {
    const tiendas = await kv.get<string[]>('otros:tiendas');
    return tiendas || [];
  } catch (error) {
    console.error('Error al obtener tiendas personalizadas:', error);
    return [];
  }
}

export async function addOtroTienda(tienda: string): Promise<boolean> {
  try {
    const tiendas = await getOtrosTiendas();
    
    // Verificar si la tienda ya existe
    if (tiendas.includes(tienda)) {
      return false; // La tienda ya existe
    }
    
    // Añadir la nueva tienda
    const updatedTiendas = [...tiendas, tienda];
    await kv.set('otros:tiendas', updatedTiendas);
    return true;
  } catch (error) {
    console.error('Error al añadir tienda personalizada:', error);
    return false;
  }
}

export async function deleteOtroTienda(tienda: string): Promise<boolean> {
  try {
    const tiendas = await getOtrosTiendas();
    
    // Filtrar la tienda a eliminar
    const updatedTiendas = tiendas.filter(t => t !== tienda);
    
    // Si no hay cambios, la tienda no existía
    if (updatedTiendas.length === tiendas.length) {
      return false;
    }
    
    await kv.set('otros:tiendas', updatedTiendas);
    return true;
  } catch (error) {
    console.error('Error al eliminar tienda personalizada:', error);
    return false;
  }
}
