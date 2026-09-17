import type { Category, Expense } from '@/domain/types';
import { toISODateString } from '@/utils/date';

export type ReportPeriod = 'week' | 'month' | 'all';

export interface PeriodRange {
  /** ISO date (YYYY-MM-DD), inclusive. `null` = sin límite. */
  start: string | null;
  /** ISO date (YYYY-MM-DD), inclusive. `null` = sin límite. */
  end: string | null;
}

// Calcula el rango de fechas del período seleccionado, relativo a
// `referenceDate` (normalmente "hoy"). 'week' y 'month' usan semana/mes
// calendario completos (lunes a domingo / día 1 al último del mes), no
// "últimos 7/30 días", para que coincida con lo que alguien espera al
// pensar "esta semana" o "este mes".
export function getPeriodRange(period: ReportPeriod, referenceDate: Date): PeriodRange {
  if (period === 'all') {
    return { start: null, end: null };
  }

  if (period === 'week') {
    const dayOfWeek = referenceDate.getDay(); // 0 = domingo
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toISODateString(monday), end: toISODateString(sunday) };
  }

  const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  return { start: toISODateString(firstDay), end: toISODateString(lastDay) };
}

export function filterExpensesByRange(expenses: Expense[], range: PeriodRange): Expense[] {
  return expenses.filter((expense) => {
    if (range.start && expense.date < range.start) {
      return false;
    }
    if (range.end && expense.date > range.end) {
      return false;
    }
    return true;
  });
}

export interface CategoryBreakdownItem {
  categoryId: number;
  name: string;
  /** Centavos. */
  total: number;
}

// Ordenado de mayor a menor gasto, para que el gráfico y la leyenda
// resalten primero las categorías donde más se ha gastado.
export function getCategoryBreakdown(
  expenses: Expense[],
  categories: Category[],
): CategoryBreakdownItem[] {
  const totalsByCategory = new Map<number, number>();
  for (const expense of expenses) {
    totalsByCategory.set(
      expense.categoryId,
      (totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount,
    );
  }

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  return Array.from(totalsByCategory.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      name: categoryNameById.get(categoryId) ?? '—',
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface CumulativeSpendPoint {
  date: string;
  /** Centavos. */
  cumulative: number;
}

// Serie de gasto acumulado en el tiempo: un punto por fecha con al menos un
// gasto (no un punto por gasto individual), para que la curva no se sature
// si hay varios gastos el mismo día.
export function getCumulativeSpendSeries(expenses: Expense[]): CumulativeSpendPoint[] {
  const totalsByDate = new Map<string, number>();
  for (const expense of expenses) {
    totalsByDate.set(expense.date, (totalsByDate.get(expense.date) ?? 0) + expense.amount);
  }

  const sortedDates = Array.from(totalsByDate.keys()).sort();
  let running = 0;
  return sortedDates.map((date) => {
    running += totalsByDate.get(date) ?? 0;
    return { date, cumulative: running };
  });
}
