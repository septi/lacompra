// Utilidad para mover un elemento de un array de una posición a otra
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [moved] = newArray.splice(from, 1);
  newArray.splice(to, 0, moved);
  return newArray;
}
