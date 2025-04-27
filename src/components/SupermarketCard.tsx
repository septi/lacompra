// Componente para mostrar la tarjeta de un supermercado en la página principal
import Link from 'next/link';
import Image from 'next/image';

interface SupermarketCardProps {
  name: string; // Display name (e.g., "Mercadona", "Otros")
  slug: string; // URL slug (e.g., "mercadona", "otros")
  colorClass: string; // Tailwind background color class (e.g., "bg-green-600")
}

// Mapeo de slugs a rutas de imágenes locales
const supermarketLogos: { [key: string]: string } = {
  mercadona: '/images/mercadona.jpg',
  eroski: '/images/eroski.png',
  gadis: '/images/gadis.png',
  lidl: '/images/lidl.png',
  froiz: '/images/froiz.png',
  otros: '/images/mercadona.jpg', // Usar una imagen por defecto para 'otros'
};

export default function SupermarketCard({ name, slug, colorClass }: SupermarketCardProps) {
  const href = slug === 'otros' ? '/otros' : `/super/${slug}`;
  
  // Usar la imagen correspondiente al slug o una imagen por defecto
  const logoPath = supermarketLogos[slug] || supermarketLogos.otros;

  // Determinar si es el botón "otros" para mantener su estilo especial
  const isOtrosButton = slug === 'otros';

  return (
    <Link 
      href={href} 
      className={`block p-4 rounded-lg shadow-md transition-transform hover:scale-105 ${isOtrosButton ? colorClass : 'bg-white'}`}
    >
      <div className="flex flex-col justify-center items-center">
        {/* Mostrar la imagen solo si NO es el botón "otros" */}
        {!isOtrosButton ? (
          <div className="w-32 h-32 relative flex items-center justify-center">
            <img 
              src={logoPath}
              alt={name}
              className="max-w-full max-h-full object-contain"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        ) : (
          <div className="w-32 h-32 flex items-center justify-center">
            <h2 className="text-xl font-bold text-white text-center">{name}</h2>
          </div>
        )}
      </div>
    </Link>
  );
}
