import { NextResponse } from 'next/server';
import {
  getOtrosTiendas,
  addOtroTienda,
  deleteOtroTienda,
} from '@/lib/kv';
import { revalidatePath } from 'next/cache';

// GET handler to fetch all custom stores
export async function GET() {
  try {
    const tiendas = await getOtrosTiendas();
    if (tiendas === null) {
      return NextResponse.json({ error: 'Failed to fetch tiendas' }, { status: 500 });
    }
    return NextResponse.json(tiendas);
  } catch (error) {
    console.error('GET /api/otros/tiendas error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler to add a new custom store
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid store name' }, { status: 400 });
    }

    // Basic slugification (lowercase, replace spaces with hyphens, remove invalid chars)
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (!slug) {
        return NextResponse.json({ error: 'Store name cannot be empty or only invalid characters' }, { status: 400 });
    }

    const success = await addOtroTienda(slug);

    if (!success) {
      return NextResponse.json({ error: 'Failed to add store' }, { status: 500 });
    }

    // Revalidate the 'otros' page cache after adding
    revalidatePath('/otros');

    return NextResponse.json({ message: 'Store added successfully', slug: slug }, { status: 201 });
  } catch (error) {
    console.error('POST /api/otros/tiendas error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to remove a custom store
export async function DELETE(request: Request) {
  try {
    const { name } = await request.json(); // Expecting the slug name

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid store name provided for deletion' }, { status: 400 });
    }

    const success = await deleteOtroTienda(name);

    if (!success) {
      // It might fail if the store didn't exist, but we'll treat it as success for the client
      // unless there was a specific KV error caught in deleteOtroTienda
      // Let's assume deleteOtroTienda handles logging actual errors
      console.warn(`Attempted to delete non-existent or failed-to-delete store: ${name}`);
      // Consider returning 204 No Content or 404 Not Found if strictness needed
    }

    // Revalidate the 'otros' page cache after deleting
    revalidatePath('/otros');

    return NextResponse.json({ message: 'Store deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error('DELETE /api/otros/tiendas error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
