import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener la URL solicitada
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Crear una respuesta personalizada
  const response = NextResponse.next();

  // Verificar si la URL corresponde a archivos JavaScript
  if (pathname.match(/\/_next\/static\/chunks\/.*\.js$/) || pathname.match(/\/_next\/static\/.*\.js$/)) {
    // Configurar encabezado para archivos JavaScript
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } 
  // Verificar si la URL corresponde a archivos CSS
  else if (pathname.match(/\/_next\/static\/css\/.*\.css$/)) {
    response.headers.set('Content-Type', 'text/css; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Verificar si es una API
  else if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  }
  // Para páginas HTML y otros recursos
  else {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  // Otros encabezados de seguridad comunes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Configurar las rutas donde aplicar el middleware
export const config = {
  matcher: [
    // Aplicar a todas las rutas excepto _next/static/images
    '/((?!_next/static/images).*)',
  ],
};
