// Los montos se guardan siempre en centavos (enteros) para evitar errores
// de punto flotante. Estas funciones convierten entre la unidad "humana"
// (la que el usuario teclea, ej. 1500.5) y centavos.

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(fromCents(cents));
}
