import { Redis } from '@upstash/redis';

// Define the structure of list items
export interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  comprado?: boolean; // comprado flag
  seccion?: string;  // sección asignada
}

// --- Redis Client Initialization ---
const redisUrl = process.env.KV_REST_API_URL;
if (!redisUrl) {
  // Critical error if URL is missing
  throw new Error('[Upstash Redis] KV_REST_API_URL environment variable is not set.');
}

const redisToken = process.env.KV_REST_API_TOKEN;
if (!redisToken) {
  // Log warning, but allow connection if token is optional (e.g., local dev without auth)
  console.warn('[Upstash Redis] KV_REST_API_TOKEN environment variable not set. Connection might fail if token is required.');
}

console.log(`--- Connecting to Redis ---`);
console.log(`URL: ${redisUrl ? redisUrl.substring(0, 15) + '...' : 'Not Set'}`);
console.log(`Token Set: ${!!redisToken}`);
console.log(`---------------------------`);

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

/**
 * Limpia una lista en Redis, eliminando elementos inválidos.
 * @param listName El nombre de la lista (puede ser un slug de supermercado o la clave completa).
 * @returns true si la limpieza fue exitosa, false en caso contrario.
 */
export async function cleanList(listName: string): Promise<boolean> {
    try {
        // Determinar si el nombre es un slug o una clave completa
        const key = listName.startsWith('list:') ? listName : getKey(listName);
        console.log(`Limpiando lista: ${key}`);
        
        // Obtener todos los elementos de la lista
        const kv = redis;
        if (!kv) {
            console.error('Failed to get Redis client');
            return false;
        }
        
        const itemStrings = await kv.lrange(key, 0, -1);
        
        if (!itemStrings || itemStrings.length === 0) {
            console.log(`Lista ${key} vacía o no existe, no hay nada que limpiar.`);
            return true; // No hay nada que limpiar
        }
        
        console.log(`Limpiando ${itemStrings.length} elementos de la lista ${key}`);
        
        // Filtrar elementos válidos
        const validItems: ListItem[] = [];
        
        for (const itemStr of itemStrings) {
            try {
                // Verificar si es un string válido
                if (typeof itemStr !== 'string') {
                    console.log(`Ignorando elemento no string: ${typeof itemStr}`);
                    continue;
                }
                
                // Ignorar [object Object] y otros valores inválidos
                if (itemStr === '[object Object]') {
                    console.log(`Ignorando [object Object] inválido`);
                    continue;
                }
                
                // Intentar parsear como JSON
                let parsed: any;
                try {
                    parsed = JSON.parse(itemStr);
                } catch (parseError) {
                    console.log(`Ignorando elemento que no es JSON válido: ${itemStr.substring(0, 30)}...`);
                    continue;
                }
                
                // Verificar que tenga la estructura correcta
                if (!parsed || typeof parsed !== 'object') {
                    console.log(`Ignorando elemento que no es un objeto: ${JSON.stringify(parsed).substring(0, 30)}...`);
                    continue;
                }
                
                if (!parsed.id || !parsed.nombre) {
                    console.log(`Ignorando objeto sin id o nombre: ${JSON.stringify(parsed).substring(0, 30)}...`);
                    continue;
                }
                
                // Añadir elemento limpio a la lista
                validItems.push({
                    id: String(parsed.id),
                    nombre: String(parsed.nombre),
                    cantidad: Number(parsed.cantidad || 1),
                    comprado: parsed.comprado ?? false,
                    seccion: parsed.seccion ?? ''
                });
            } catch (error) {
                // Ignorar elementos que no se pueden procesar
                console.error(`Error inesperado al procesar elemento:`, error);
                continue;
            }
        }
        
        console.log(`Se encontraron ${validItems.length} elementos válidos de ${itemStrings.length} originales`);
        
        // Si no hay elementos válidos, vaciar la lista
        if (validItems.length === 0) {
            await kv.del(key);
            console.log(`Lista ${key} limpiada (eliminada por no tener elementos válidos).`);
            return true;
        }
        
        // Vaciar la lista actual
        await kv.del(key);
        
        // Añadir los elementos válidos uno por uno
        for (const item of validItems) {
            const itemString = JSON.stringify(item);
            await kv.rpush(key, itemString);
        }
        
        console.log(`Lista ${key} limpiada exitosamente. ${validItems.length} elementos válidos de ${itemStrings.length} originales.`);
        return true;
    } catch (error) {
        console.error(`Error al limpiar la lista ${listName}:`, error);
        return false;
    }
}

// --- Redis List Helper Functions ---

// Helper function to build the Redis key for a list
const getKey = (superSlug: string) => `list:${superSlug}`;

import { ItemPredictivo } from '@/types/itemPredictivo';

// --- Predictivos ---
export async function getItemPredictivos(): Promise<ItemPredictivo[]> {
    const key = getKey('items');
    console.log(`Fetching predictivos (key: ${key})`);
    try {
        const itemStrings = await redis.lrange(key, 0, -1);
        if (!itemStrings || itemStrings.length === 0) return [];
        return itemStrings.map((itemData: string) => {
            try {
                const parsed = JSON.parse(itemData);
                return {
                    id: parsed.id ?? crypto.randomUUID(),
                    nombre: parsed.nombre ?? parsed.item ?? '',
                    seccion: parsed.seccion ?? ''
                };
            } catch {
                return null;
            }
        }).filter(Boolean) as ItemPredictivo[];
    } catch (err) {
        console.error('Error fetching predictivos:', err);
        return [];
    }
}

export async function setItemPredictivos(list: ItemPredictivo[]): Promise<void> {
    const key = getKey('items');
    await redis.del(key);
    if (list.length > 0) {
        await redis.rpush(key, ...list.map(i => JSON.stringify(i)));
    }
}


// --- Listas de supermercado ---
export async function getSuperList(superSlug: string): Promise<ListItem[]> {
    const key = getKey(superSlug);
    console.log(`Fetching super list for ${superSlug} (key: ${key})`);
    try {
        const itemStrings = await redis.lrange(key, 0, -1);
        if (!itemStrings || itemStrings.length === 0) return [];
        return itemStrings.map((itemData: any) => {
            const parsed = typeof itemData === 'string' ? JSON.parse(itemData) : itemData;
            return {
                id: parsed.id ?? crypto.randomUUID(),
                nombre: parsed.nombre ?? parsed.item ?? '',
                cantidad: parsed.cantidad ?? 1,
                comprado: parsed.comprado ?? false,
                seccion: parsed.seccion ?? ''
            };
        });
    } catch (err) {
        console.error('Error fetching super list:', err);
        return [];
    }
}

export async function setSuperList(superSlug: string, list: ListItem[]): Promise<void> {
    const key = getKey(superSlug);
    await redis.del(key);
    if (list.length > 0) {
        await redis.rpush(key, ...list.map(i => JSON.stringify(i)));
    }
}

/**
 * @deprecated Usar getItemPredictivos o getSuperList según el caso
 */
export async function getList(superSlug: string): Promise<any[]> {
    console.warn('getList is deprecated, use getItemPredictivos or getSuperList instead');
    if (superSlug === 'items') return getItemPredictivos();
    return getSuperList(superSlug);
}

/**
 * Adds a new item to the end of a Redis list.
 * @param superSlug The supermarket slug.
 * @param item The ListItem to add.
 * @returns True if successful, false otherwise.
 */
export async function addItem(superSlug: string, item: ListItem): Promise<boolean> {
  const key = getKey(superSlug);
  try {
    // Asegurar que el objeto tenga la estructura correcta
    const cleanItem: ListItem = {
      id: String(item.id),
      nombre: String(item.nombre),
      cantidad: Number(item.cantidad || 1),
      comprado: item.comprado ?? false,
      seccion: item.seccion ?? ''
    };
    
    // Serializar correctamente a JSON
    const itemString = JSON.stringify(cleanItem);
    
    // Verificar que no estamos guardando [object Object]
    if (itemString === '[object Object]') {
      throw new Error('Invalid serialization: [object Object]');
    }
    
    await redis.rpush(key, itemString);
    console.log(`Added item to ${key}:`, cleanItem.nombre);
    return true;
  } catch (error) {
    console.error(`Error adding item to ${key}:`, error);
    return false;
  }
}

/**
 * Removes *all* occurrences of a specific item (identified by its exact JSON string) from a list.
 * Note: This requires having the exact string representation of the item as stored in Redis.
 * @param superSlug The supermarket slug.
 * @param itemString The exact JSON string of the item to remove.
 * @returns True if the command was executed (doesn't necessarily mean items were removed), false on error.
 */
export async function removeItemByValue(superSlug: string, itemString: string): Promise<boolean> {
    const key = getKey(superSlug);
    try {
        // LREM key 0 value -> remove all occurrences of 'value'
        const removedCount = await redis.lrem(key, 0, itemString);
        console.log(`Removed ${removedCount} occurrences of item from ${key}`);
        return true; // Command succeeded
    } catch (error) {
        console.error(`Error removing item from ${key}:`, error);
        return false;
    }
}

/**
 * Updates an item at a specific index in the list.
 * Note: Redis lists are 0-indexed.
 * @param superSlug The supermarket slug.
 * @param index The index of the item to update.
 * @param item The new ListItem data.
 * @returns True if successful, false otherwise.
 */
export async function updateItemByIndex(superSlug: string, index: number, item: ListItem): Promise<boolean> {
    const key = getKey(superSlug);
    try {
        // Asegurar que el objeto tenga la estructura correcta
        const cleanItem: ListItem = {
            id: String(item.id),
            nombre: String(item.nombre),
            cantidad: Number(item.cantidad || 1),
            comprado: item.comprado ?? false,
            seccion: item.seccion ?? ''
        };
        
        // Serializar correctamente a JSON
        const itemString = JSON.stringify(cleanItem);
        
        // Verificar que no estamos guardando [object Object]
        if (itemString === '[object Object]') {
            throw new Error('Invalid serialization: [object Object]');
        }
        
        // LSET key index value
        await redis.lset(key, index, itemString);
        console.log(`Updated item at index ${index} in ${key}`);
        return true;
    } catch (error) {
        // Common error: index out of range
        console.error(`Error updating item at index ${index} in ${key}:`, error);
        return false;
    }
}

/**
 * Replaces the entire list content with a new list of items.
 * Uses a transaction (DEL + RPUSH) for atomicity.
 * @param superSlug The supermarket slug.
 * @param items The new array of ListItems.
 * @returns True if successful, false otherwise.
 */
export async function replaceList(superSlug: string, items: ListItem[]): Promise<boolean> {
    const key = getKey(superSlug);
    try {
        // Limpiar y validar cada elemento
        const cleanItems = items.map(item => ({
            id: String(item.id),
            nombre: String(item.nombre),
            cantidad: Number(item.cantidad || 1),
            comprado: item.comprado ?? false,
            seccion: item.seccion ?? ''
        }));
        
        // Si el array está vacío, NO modificar la lista (protección anti-borrado)
        if (cleanItems.length === 0) {
            console.warn(`replaceList: llamada ignorada porque items está vacío para ${key}`);
            return true;
        }

        // Serializar correctamente a JSON
        const itemStrings = cleanItems.map(item => {
            const str = JSON.stringify(item);
            // Verificar que no estamos guardando [object Object]
            if (str === '[object Object]') {
                throw new Error('Invalid serialization: [object Object]');
            }
            return str;
        });
        
        // Iniciar transacción
        const tx = redis.multi();
        tx.del(key);
        itemStrings.forEach(item => {
            tx.rpush(key, item);
        });
        const result = await tx.exec();
        if (result === null || result.includes(null)) {
             console.error(`Transaction failed for replacing list ${key}. Result:`, result);
             return false;
        }
        console.log(`Replaced list ${key} with ${items.length} items. Result:`, result);
        return true;
    } catch (error) {
        console.error(`Error replacing list ${key}:`, error);
        return false;
    }
}
