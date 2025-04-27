import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getItemPredictivos, setItemPredictivos } from '@/lib/redis';

// GET /api/items - retrieve the list of backup/editable items
export async function GET(request: NextRequest) {
  try {
    const items = await getItemPredictivos();
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// PATCH /api/items - replace the list of items
export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    if (!Array.isArray(payload.orderedList)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    // Convertir todos los elementos a ItemPredictivo
    const itemPredictivos = payload.orderedList.map((e: any) => {
      if (typeof e.id === 'string' && typeof e.nombre === 'string') {
        return { id: e.id, nombre: e.nombre, seccion: e.seccion ?? '' };
      }
      return {
        id: uuidv4(),
        nombre: e.item ?? '',
        seccion: e.seccion ?? ''
      };
    });
    await setItemPredictivos(itemPredictivos);
    return NextResponse.json({ message: 'Items updated' });
  } catch (error) {
    console.error('PATCH /api/items error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
