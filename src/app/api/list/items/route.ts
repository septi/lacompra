import { NextResponse, NextRequest } from 'next/server';
import { getItemPredictivos } from '@/lib/redis';

/**
 * GET handler to fetch predictive items stored in Redis under 'items' list.
 */
export async function GET(request: NextRequest) {
  try {
    const items = await getItemPredictivos();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('Error fetching predictive items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
