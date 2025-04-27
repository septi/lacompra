<proyecto_lacompra>

<caracteristicas_tecnicas>
- Framework: Next.js 15
- UI Library: React 18
- Styling: Tailwind CSS 3
- Routing: App Router
- Language: TypeScript
- Linting: ESLint (config next)
- Package Manager: npm
- Alias de Importación: @/* apunta a ./src/*
- Almacenamiento: Vercel KV (Upstash Redis)
- PWA: Sí (configurado con next-pwa)
- Hosting: Vercel
- Repositorio: GitHub (pendiente de creación)
</caracteristicas_tecnicas>

<estructura_proyecto>
- next.config.ts: Configuración de Next.js.
- tsconfig.json: Configuración de TypeScript.
- tailwind.config.ts: Configuración de Tailwind CSS.
- package.json: Dependencias y scripts (incluye @dnd-kit/core, @dnd-kit/sortable, next-pwa, tailwindcss).
- .eslintrc.json: Configuración de ESLint.
- proyecto.md: Documentación técnica y memoria del estado actual.
- src/
  - app/
    - layout.tsx: Layout principal y metadata.
    - page.tsx: Página de inicio.
    - globals.css: Estilos globales.
    - super/[super]/page.tsx: Página de lista de compras con drag & drop y autocompletado.
    - otros/page.tsx: Gestión de tiendas adicionales.
  - app/api/list/[super]/route.ts: API CRUD y reordenamiento de ítems.
  - app/api/list/clean/route.ts: Ruta para limpieza de listas en Redis.
  - lib/redis.ts: Helpers de interacción con Vercel KV (Upstash).
  - data/
    - items.ts: Listado de ítems fijos para autocompletado.
    - constants.ts: Constantes (ej. FIXED_SUPERS).
  - components/
    - AllItemsList.tsx: Vista consolidada de todos los ítems.
</estructura_proyecto>

<consideraciones_tecnicas_importantes>
<rutas_api_nextjs_15>
- Problema con Parámetros Dinámicos: En Next.js 15, intentar acceder a params.paramName causa el error params should be awaited before using its properties.
- Solución implementada: Extraer los parámetros directamente de la URL en lugar de usar el objeto params.
- Ventajas: Este enfoque evita completamente los problemas con los parámetros dinámicos en Next.js 15 y es más robusto ante cambios en la API.
</rutas_api_nextjs_15>

<Tema_claro_forzado>
La aplicación está configurada para usar siempre el tema claro mediante:
- Clase light en el elemento html
- Meta tag <meta name="color-scheme" content="light only" />
- Clases bg-white text-black en el elemento body
</Tema_claro_forzado>

<vercel_kv_redis>
- La interfaz ListItem en src/lib/redis.ts usa comprado (no done) para el estado de los items.
- Serialización de objetos: Es crucial asegurar que todos los objetos se serialicen correctamente antes de almacenarlos en Redis.
- Problema común: El error Failed to parse item string: >>>[object Object]<<< ocurre cuando se almacena un objeto JavaScript directamente en Redis sin serializarlo correctamente a JSON.
- Solución robusta: getSuperList parsea defensivamente cada elemento, aceptando tanto string JSON como objeto ya parseado, evitando listas vacías por errores de formato.
</vercel_kv_redis>

<manejo_tipos_datos_redis>
- Redis puede devolver tanto objetos JavaScript directos como cadenas JSON dependiendo del contexto.
- Solución: Las funciones de gestión de Redis ahora manejan ambos formatos de manera robusta (parseo defensivo en getSuperList).
- Beneficios: Mayor robustez en la interacción con Redis, menos errores de serialización y deserialización.
</manejo_tipos_datos_redis>

<drag_and_drop>
- Biblioteca utilizada: @dnd-kit/core y @dnd-kit/sortable, compatibles con React 19.
- Persistencia: Al finalizar el arrastre, se envía la lista reordenada al servidor mediante una petición PATCH.
- UX mejorada: icono de arrastre, separación, contraste, selector optimizado, autocompletado, animaciones, etc.
- El frontend ya no envía PATCH tras cada fetch, solo en acciones explícitas de reordenar o editar.
</drag_and_drop>

<vista_consolidada>
- Funcionalidad: Muestra todos los elementos de todas las listas en la página principal.
- Implementación: Componente AllItemsList que obtiene y combina elementos de todas las listas.
- Visual: Indicador de color, navegación, soporte para tiendas personalizadas.
</vista_consolidada>

<limpieza_listas>
- Ruta API específica (/api/list/clean) para limpiar las listas de Redis y eliminar elementos inválidos.
- Botón Reparar lista en la interfaz.
- Implementación: PATCH y recarga de la lista.
- Protección anti-borrado: replaceList nunca borra la lista si el array recibido es vacío.
</limpieza_listas>

<gestion_listas_robusta>
- El parseo de listas en getSuperList es defensivo: acepta tanto strings como objetos ya parseados, sin logs ni filtros innecesarios.
- Esto garantiza que la lista nunca aparecerá vacía por un error de formato, independientemente de cómo devuelva Redis los datos.
</gestion_listas_robusta>
</consideraciones_tecnicas_importantes>

<despliegue>
- Vercel.
- Nombre del proyecto: lacompra.
- Título de la web: LaCompra.
- npm y alias @/*.
- Se mantendrá un fichero proyecto.md.
</despliegue>

<interfaz_usuario>
- Diseño Responsivo: móvil y escritorio.
- Tema Claro: colores distintivos por supermercado.
- Iconos y Animaciones: Heroicons y animaciones sutiles.
- Imágenes de Supermercados: logotipos sin fondo, excepto Otros.
- Supermercados Soportados: Mercadona, Eroski, Gadis, Lidl, Froiz y Otros.
</interfaz_usuario>

</proyecto_lacompra>