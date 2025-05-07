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

// Mapping slugs to palette gradients
const gradientMap: Record<string, string> = {
  mercadona: 'var(--gradient-top)',
  eroski: 'var(--gradient-right)',
  lidl: 'var(--gradient-bottom)',
  gadis: 'var(--gradient-left)',
  froiz: 'var(--gradient-top-right)',
  proximamente: 'var(--gradient-bottom-right)',
  'cosas-varias': 'var(--gradient-top-left)',
};

export default function SupermarketCard({ name, slug }: SupermarketCardProps) {
  const href = slug === 'otros' ? '/otros' : `/super/${slug}`;
  
  // Usar la imagen correspondiente al slug si existe
  const logoPath = supermarketLogos[slug];

  const background = gradientMap[slug] || 'var(--gradient-radial)';
  const noGradientSupers = ['mercadona','eroski','lidl','gadis','froiz'];
  const finalBackground = noGradientSupers.includes(slug) ? 'transparent' : background;

  return (
    <Link
      href={href}
      className="block p-4 rounded-lg shadow-md transition-transform hover:scale-105"
      style={{ background: finalBackground }}
    >
      <div className="flex flex-col justify-center items-center">
        {/* Mostrar la imagen solo si no es especial y existe logo */}
        {logoPath ? (
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
            <h2 className="cal-sans-regular text-2xl font-bold text-white text-center">{name}</h2>
          </div>
        )}
      </div>
    </Link>
  );
}
