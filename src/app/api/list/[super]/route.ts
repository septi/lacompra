import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // For generating item IDs
import { revalidatePath } from 'next/cache'; // Import for cache invalidation
import {
  getList,
  addItem,       // Use addItem
  replaceList,   // Use replaceList for updates/deletes/reorders
  ListItem,
} from '@/lib/redis';

// Helper function to extract supermarket slug from URL
function extractSuperSlugFromURL(url: string): string {
  try {
    // Convertir la URL a un objeto URL para manejarla mejor
    const urlObj = new URL(url);
    
    // La ruta será algo como /api/list/mercadona o /api/list/eroski
    const pathname = urlObj.pathname;
    const pathParts = pathname.split('/');
    
    // El último segmento de la ruta es el slug
    const slug = pathParts[pathParts.length - 1];
    
    console.log(`Extracting slug from URL ${url} -> ${slug}`);
    return slug;
  } catch (error) {
    console.error(`Error extracting slug from URL ${url}:`, error);
    return '';
  }
}

// GET handler to fetch list items
export async function GET(request: NextRequest) {
  try {
    // Extract superSlug from URL instead of params
    const superSlug = extractSuperSlugFromURL(request.url);
    
    // Check for superSlug presence
    if (!superSlug) {
      return NextResponse.json({ error: 'Supermarket slug is required' }, { status: 400 });
    }
    
    console.log(`GET: Fetching list for supermarket: ${superSlug}`);
    
    // Ahora getList siempre devuelve un array (vacío en caso de error)
    const list = await getList(superSlug); // Pass slug directly
    
    // Devolver la lista (que podría estar vacía)
    return NextResponse.json(list);
  } catch (error) {
    // Log error with generic message
    console.error(`GET /api/list/ error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler to add a new item
export async function POST(request: NextRequest) {
  try {
    // Extract superSlug from URL instead of params
    const superSlug = extractSuperSlugFromURL(request.url);
    
    // Get request body
    const { nombre, cantidad = 1 } = await request.json();
    
    // Check for superSlug presence
    if (!superSlug) {
      return NextResponse.json({ error: 'Supermarket slug is required' }, { status: 400 });
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid item name' }, { status: 400 });
    }
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
      return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
    }

    // Create a new item with the provided data
    // Asegurar que todos los campos sean del tipo correcto
    const newItem: ListItem = {
      id: uuidv4(), // Generate a unique ID
      nombre: String(nombre), // Asegurar que sea string
      cantidad: Number(cantidad), // Asegurar que sea número

    };

    // Use the new addItem function
    const success = await addItem(superSlug, newItem);

    if (!success) {
      return NextResponse.json({ error: 'Failed to add item to list' }, { status: 500 });
    }

    revalidatePath(`/super/${superSlug}`);
    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error(`POST /api/list/ error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH handler to update item(s) or reorder list
export async function PATCH(request: NextRequest) {
  try {
    // Extract superSlug from URL instead of params
    const superSlug = extractSuperSlugFromURL(request.url);
    
    // Get request body
    const payload = await request.json();
    
    // Check for superSlug presence
    if (!superSlug) {
      return NextResponse.json({ error: 'Supermarket slug is required' }, { status: 400 });
    }
    
    console.log(`PATCH: Updating list for supermarket: ${superSlug}`);

    // Opción 1: Reordenar lista completa
    if (Array.isArray(payload.orderedList)) {
        const success = await replaceList(superSlug, payload.orderedList as ListItem[]);
        if (!success) {
            return NextResponse.json({ error: 'No se pudo reordenar la lista' }, { status: 500 });
        }
        revalidatePath(`/super/${superSlug}`);
        return NextResponse.json({ message: 'Lista reordenada correctamente' });
    }

    // Option 2: Updating a single item's properties (cantidad)
    if (payload.itemId && payload.cantidad !== undefined) {
      const { itemId, cantidad } = payload;

      if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
         return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }

      // Ahora getList siempre devuelve un array (vacío en caso de error)
      const currentList = await getList(superSlug);
      
      if (currentList.length === 0) {
        return NextResponse.json({ error: 'List not found or empty' }, { status: 404 });
      }

      let itemFound = false;
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          itemFound = true;
          // Crear un objeto limpio para evitar problemas de serialización
          const updatedItem: ListItem = {
            id: item.id,
            nombre: item.nombre,
            cantidad: cantidad
          };
          return updatedItem;
        }
        // Asegurar que todos los elementos sean objetos limpios
        return item;
      });

      if (!itemFound) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Use replaceList to save the modified list
      const success = await replaceList(superSlug, updatedList);
      if (!success) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
      }

      revalidatePath(`/super/${superSlug}`);
      // Return the updated item
      const returnedItem = updatedList.find(item => item.id === itemId);
      return NextResponse.json(returnedItem);

    } else {
      // Invalid PATCH payload
      return NextResponse.json({ error: 'Invalid payload for PATCH request' }, { status: 400 });
    }

  } catch (error) {
    console.error(`PATCH /api/list/ error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to remove an item
export async function DELETE(request: NextRequest) {
  try {
    // Extract superSlug from URL instead of params
    const superSlug = extractSuperSlugFromURL(request.url);
    
    // Get request body
    const { itemId } = await request.json();
   
    // Check for superSlug presence
    if (!superSlug) {
      return NextResponse.json({ error: 'Supermarket slug is required' }, { status: 400 });
    }

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }
    
    console.log(`DELETE: Removing item ${itemId} from supermarket: ${superSlug}`);

    // Ahora getList siempre devuelve un array (vacío en caso de error)
    const currentList = await getList(superSlug);
    
    if (currentList.length === 0) {
      // Item or list doesn't exist
      return NextResponse.json({ message: 'List is empty or item not found' }, { status: 404 });
    }

    // Filtrar el elemento a eliminar y asegurar que todos los elementos sean objetos limpios
    const updatedList = currentList
      .filter(item => item.id !== itemId)
      .map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad
      }));

    // If the list length hasn't changed, the item wasn't found
    if (updatedList.length === currentList.length) {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    // Use replaceList to save the filtered list
    const success = await replaceList(superSlug, updatedList);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    revalidatePath(`/super/${superSlug}`);
    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error(`DELETE /api/list/ error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
