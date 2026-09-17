import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { BudgetEntry, Category, Expense } from '@/domain/types';
import { toCsv } from '@/utils/csv';
import { fromCents } from '@/utils/money';

// Todos los montos se exportan en unidades "humanas" (ej. "1500.50", no en
// centavos): son las que el usuario espera ver al abrir el CSV en
// Excel/Sheets. Estas mismas cabeceras las espera src/utils/importCsv.ts.

export function buildExpensesCsv(expenses: Expense[], categories: Category[]): string {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const rows = expenses.map((expense) => [
    expense.date,
    fromCents(expense.amount).toFixed(2),
    categoryNameById.get(expense.categoryId) ?? '—',
    expense.note ?? '',
  ]);
  return toCsv(['Fecha', 'Monto', 'Categoría', 'Nota'], rows);
}

export function buildBudgetEntriesCsv(entries: BudgetEntry[]): string {
  const rows = entries.map((entry) => [
    entry.date,
    entry.type === 'initial' ? 'Inicial' : 'Incremento',
    fromCents(entry.amount).toFixed(2),
    entry.note ?? '',
  ]);
  return toCsv(['Fecha', 'Tipo', 'Monto', 'Nota'], rows);
}

// Escribe el CSV en un archivo temporal (caché) y abre el share sheet de
// Android para que el usuario lo guarde o lo envíe (Drive, WhatsApp, correo,
// etc.). No se conserva ningún respaldo dentro de la app: cada exportación
// sobreescribe el archivo temporal anterior con el mismo nombre.
export async function shareCsv(filename: string, csvContent: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(csvContent);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartir CSV',
  });
}
