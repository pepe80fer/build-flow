// Las fechas se guardan en SQLite como texto ISO 'YYYY-MM-DD' (el orden
// lexicográfico coincide con el cronológico, útil para ORDER BY).

export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODateString(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}
