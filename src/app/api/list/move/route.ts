import { NextRequest, NextResponse } from 'next/server';
import { redis, type ListItem } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const { itemId, itemData, originSuper, destinationSuper } = await request.json() as {
            itemId: string;
            itemData: ListItem; // The full item object
            originSuper: string;
            destinationSuper: string;
        };

        if (!itemId || !itemData || !originSuper || !destinationSuper) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Asegurarnos de que el objeto itemData sea serializable
        // Crear una copia limpia del objeto para evitar problemas de serialización
        const cleanItem: ListItem = {
            id: itemData.id,
            nombre: itemData.nombre,
            cantidad: itemData.cantidad,
            comprado: itemData.comprado ?? false,
            seccion: itemData.seccion ?? '',
            link: itemData.link ?? '',
            compradoAt: itemData.compradoAt ?? null,
        };
        
        // Convertir a JSON para almacenar en Redis
        const itemString = JSON.stringify(cleanItem);

        // Use a Redis transaction to ensure atomicity
        const tx = redis.multi();

        // 1. Remove the item from the origin list
        //    LREM key count value - count 0 removes all matches
        tx.lrem(`list:${originSuper}`, 0, itemString);

        // 2. Add the item to the destination list
        tx.rpush(`list:${destinationSuper}`, itemString);

        // Execute the transaction
        const result = await tx.exec();

        // Check transaction results (optional, but good practice)
        // result is an array of results for each command in the transaction.
        // For LREM, it's the number of removed elements. For RPUSH, it's the new length.
        if (result === null) {
            // Transaction failed (e.g., WATCH condition failed)
            throw new Error('Redis transaction failed.');
        }
        if (result.includes(null) || (result[0] as number) < 1) {
             // One of the commands failed or item wasn't found to remove
             console.warn(`Redis move transaction potentially failed or item not found. Result: ${JSON.stringify(result)}. ItemString: ${itemString}`);
             // Decide if this constitutes an error - perhaps the item was already deleted?
             // For now, let's proceed but log a warning.
        }

        console.log(`Moved item ${itemId} from ${originSuper} to ${destinationSuper}. Result: ${JSON.stringify(result)}`);

        // Invalidate cache for both supermarket pages
        revalidatePath(`/super/${originSuper}`);
        revalidatePath(`/super/${destinationSuper}`);

        return NextResponse.json({ success: true, result }, { status: 200 });

    } catch (error) {
        console.error('Error moving list item:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to move item', details: errorMessage }, { status: 500 });
    }
}
