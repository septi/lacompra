import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getList, replaceList } from '@/lib/redis';

// GET /api/items - retrieve the list of backup/editable items
export async function GET(request: NextRequest) {
  try {
    const list = await getList('items'); // Array of ListItem {id, nombre,...}
    // Convert to { item, seccion }
    // Map to {item, seccion}, seccion stored in Redis; cast to any for TS
    const items = list.map(i => ({
      item: i.nombre,
      seccion: (i as any).seccion ?? ''
    }));
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
    // Map to ListItem[] for Redis, preserving section
    const newList = payload.orderedList.map((e: { item: string; seccion: string }) => ({
      id: uuidv4(),
      nombre: e.item,
      cantidad: 1,
      comprado: false,
      seccion: e.seccion
    }));
    const success = await replaceList('items', newList);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Items updated' });
  } catch (error) {
    console.error('PATCH /api/items error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
