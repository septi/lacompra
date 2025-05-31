// Componente para mostrar la tarjeta de un supermercado en la página principal
import Link from 'next/link';
import Image from 'next/image';

interface SupermarketCardProps {
  name: string; // Display name (e.g., "Mercadona", "Otros")
  slug: string; // URL slug (e.g., "mercadona", "otros")
}

// Mapeo de slugs a rutas de imágenes locales
const supermarketLogos: { [key: string]: string } = {
  mercadona: '/images/mercadona.jpg',
  eroski: '/images/eroski.png',
  gadis: '/images/gadis.png',
  lidl: '/images/lidl.png',
  froiz: '/images/froiz.png',
};

// Mapping slugs to color variables
const colorMap: Record<string, string> = {
  mercadona: 'var(--mercadona)',
  eroski: 'var(--eroski)',
  lidl: 'var(--lidl)',
  gadis: 'var(--gadis)',
  froiz: 'var(--froiz)',
  otros: 'var(--otros)',
  proximamente: 'var(--proximamente)',
};

export default function SupermarketCard({ name, slug }: SupermarketCardProps) {
  const href = slug === 'otros' ? '/otros' : `/super/${slug}`;
  
  // Usar la imagen correspondiente al slug si existe
  const logoPath = supermarketLogos[slug];

  // Obtener el color asociado al supermercado
  const color = colorMap[slug] || 'var(--neutral-500)';

  return (
    <Link
      href={href}
      className="card flex flex-col justify-center items-center p-4 bg-white hover:shadow-md transition-all duration-200"
      style={{ borderTop: `3px solid ${color}` }}
    >
      {/* Mostrar la imagen solo si existe logo */}
      {logoPath ? (
        <div className="w-24 h-24 sm:w-28 sm:h-28 relative flex items-center justify-center my-2">
          <img 
            src={logoPath}
            alt={name}
            className="max-w-full max-h-full object-contain"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-neutral-100 rounded-full mb-2">
          <span className="text-2xl font-bold" style={{ color }}>{name.charAt(0)}</span>
        </div>
      )}
      <h2 className="text-lg font-medium text-neutral-800 mt-2 text-center">{name}</h2>
    </Link>
  );
}
