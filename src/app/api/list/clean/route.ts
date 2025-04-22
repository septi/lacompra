import { NextRequest, NextResponse } from 'next/server';
import { cleanList } from '@/lib/redis';
import { FIXED_SUPERS } from '@/data/constants';
import { revalidatePath } from 'next/cache';

/**
 * Ruta para limpiar las listas de Redis y eliminar elementos inválidos
 */
export async function POST(request: NextRequest) {
  try {
    const { superSlug } = await request.json();
    
    // Si se proporciona un supermercado específico, limpiar solo esa lista
    if (superSlug) {
      const success = await cleanList(superSlug);
      
      if (success) {
        // Revalidar la página del supermercado para actualizar la interfaz
        revalidatePath(`/super/${superSlug}`);
        return NextResponse.json({ 
          message: `Lista de ${superSlug} limpiada correctamente` 
        }, { status: 200 });
      } else {
        return NextResponse.json({ 
          error: `Error al limpiar la lista de ${superSlug}` 
        }, { status: 500 });
      }
    } 
    // Si no se proporciona un supermercado, limpiar todas las listas
    else {
      const results = await Promise.all(
        FIXED_SUPERS.map(async (slug) => {
          const success = await cleanList(slug);
          return { slug, success };
        })
      );
      
      // Limpiar también la lista "otros"
      const otrosResult = await cleanList('otros');
      results.push({ slug: 'otros', success: otrosResult });
      
      // Revalidar todas las páginas
      for (const { slug } of results) {
        revalidatePath(`/super/${slug}`);
      }
      
      return NextResponse.json({ 
        message: 'Todas las listas han sido limpiadas', 
        results 
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error en la limpieza de listas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
