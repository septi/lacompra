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
};

export default function SupermarketCard({ name, slug, colorClass }: SupermarketCardProps) {
  const href = slug === 'otros' ? '/otros' : `/super/${slug}`;
  
  // Usar la imagen correspondiente al slug si existe
  const logoPath = supermarketLogos[slug];

  // Determinar si es botón especial (otros, próximamente o cosas-varias)
  const isOtrosButton = slug === 'otros' || slug === 'proximamente' || slug === 'cosas-varias';

  return (
    <Link 
      href={href} 
      className={`block p-4 rounded-lg shadow-md transition-transform hover:scale-105 ${isOtrosButton ? colorClass : 'bg-white'}`}
    >
      <div className="flex flex-col justify-center items-center">
        {/* Mostrar la imagen solo si no es especial y existe logo */}
        {!isOtrosButton && logoPath ? (
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
