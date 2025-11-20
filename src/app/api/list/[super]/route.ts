import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // For generating item IDs
import { revalidatePath } from 'next/cache'; // Import for cache invalidation
import {
  getSuperList,
  addItem,
  replaceList,
  ListItem,
} from '@/lib/redis';
import { backupItems } from '@/data/items';

// Helper function to extract supermarket slug from URL
function extractSuperSlugFromURL(url: string): string {
  try {
    // Convertir la URL a un objeto URL para manejarla mejor
    const urlObj = new URL(url);
    
    // La ruta será algo como /api/list/eroski o /api/list/gadis
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
    const list = await getSuperList(superSlug);
    
    console.log('API GET /api/list/', superSlug, '-> raw list:', list);
    // Merge with backupItems to ensure seccion
    const merged = list.map(item => {
      const section = item.seccion || backupItems.find(b => b.item === item.nombre)?.seccion || '';
      return { ...item, seccion: section, link: item.link };
    });
    console.log('API GET /api/list/ merged with sections:', merged);
    return NextResponse.json(merged);

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
    const { nombre, cantidad = 1, seccion = '', link = '' } = await request.json();
    
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
      comprado: false, // default comprado flag
      seccion: String(seccion), // sección proveniente del cliente
      link: String(link),
      compradoAt: null,
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
    console.log(`PATCH payload for ${superSlug}:`, payload);
    
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
    if (payload.itemId && typeof payload.cantidad === 'number') {
      const { itemId, cantidad } = payload;

      if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
         return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }

      // Ahora getList siempre devuelve un array (vacío en caso de error)
      const currentList = await getSuperList(superSlug);
      
      if (currentList.length === 0) {
        return NextResponse.json({ error: 'List not found or empty' }, { status: 404 });
      }

      let itemFound = false;
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          itemFound = true;
          // Preserve all fields including seccion, link and comprado
          const updatedItem: ListItem = {
            ...item,
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
    }

    // Option: Updating link for an item
    if (payload.itemId && payload.link !== undefined) {
      const { itemId, link } = payload;
      const currentList = await getSuperList(superSlug);
      let found = false;
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          found = true;
          return { ...item, link: String(link) };
        }
        return item;
      });
      if (!found) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const success = await replaceList(superSlug, updatedList);
      if (!success) {
        return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
      }
      revalidatePath(`/super/${superSlug}`);
      const updatedItem = updatedList.find(item => item.id === itemId);
      return NextResponse.json(updatedItem);
    }

    // Option 3: Updating the 'comprado' flag
    if (payload.itemId && payload.comprado !== undefined) {
      const { itemId, comprado } = payload;
      const timestamp = comprado ? Date.now() : null;
      const currentList = await getSuperList(superSlug);
      let itemFound = false;
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          itemFound = true;
          return { ...item, comprado: Boolean(comprado), compradoAt: timestamp };
        }
        return item;
      });
      if (!itemFound) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const successComprado = await replaceList(superSlug, updatedList);
      if (!successComprado) {
        return NextResponse.json({ error: 'Failed to update comprado flag' }, { status: 500 });
      }
      revalidatePath(`/super/${superSlug}`);
      const returnedComprado = updatedList.find(item => item.id === itemId);
      return NextResponse.json(returnedComprado);
    }
    // Invalid PATCH payload
    return NextResponse.json({ error: 'Invalid payload for PATCH request' }, { status: 400 });

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
    const currentList = await getSuperList(superSlug);
    
    if (currentList.length === 0) {
      // Item or list doesn't exist
      return NextResponse.json({ message: 'List is empty or item not found' }, { status: 404 });
    }

    // Preserve all item fields except the deleted one
    const updatedList = currentList.filter(item => item.id !== itemId);

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
