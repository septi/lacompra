// Componente para mostrar la tarjeta de un supermercado en la página principal
import Link from 'next/link';
import Image from 'next/image';

interface SupermarketCardProps {
  name: string; // Display name (e.g., "Eroski", "Otros")
  slug: string; // URL slug (e.g., "eroski", "otros")
}

// Mapeo de slugs a rutas de imágenes locales
const supermarketLogos: { [key: string]: string } = {
  eroski: '/images/eroski.png',
  gadis: '/images/gadis.png',
  lidl: '/images/lidl.png',
};

// Mapping slugs to color variables
const colorMap: Record<string, string> = {
  eroski: 'var(--eroski)',
  lidl: 'var(--lidl)',
  gadis: 'var(--gadis)',
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
      className="card flex flex-col justify-between items-start p-3 sm:p-4 gap-3 transition-all"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-3 w-full">
        {logoPath ? (
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-alt)] flex items-center justify-center overflow-hidden">
            <img 
              src={logoPath}
              alt={name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-alt)] flex items-center justify-center">
            <span className="text-lg font-semibold" style={{ color }}>{name.charAt(0)}</span>
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-neutral-900 leading-tight">{name}</h2>
        </div>
      </div>
    </Link>
  );
}
