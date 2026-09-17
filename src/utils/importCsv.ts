import type { SQLiteDatabase } from 'expo-sqlite';

import type { BudgetEntryType, Category } from '@/domain/types';
import { addBudgetEntry } from '@/repositories/budgetEntriesRepo';
import { addExpense } from '@/repositories/expensesRepo';
import { parseCsv } from '@/utils/csv';
import { toCents } from '@/utils/money';

// Contraparte de src/utils/export.ts: lee los mismos CSV que la app genera
// (fecha en ISO tal cual se guarda, monto en unidades "humanas") y vuelve a
// crear los registros. Pensado sobre todo como red de seguridad para
// restaurar datos si se perdió la base local (ej. tras desinstalar la app),
// a partir de un respaldo exportado antes.

const EXPENSES_HEADER = ['fecha', 'monto', 'categoría', 'nota'];
const BUDGET_ENTRIES_HEADER = ['fecha', 'tipo', 'monto', 'nota'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ImportResult {
  imported: number;
  skipped: number;
  /** Máximo unas pocas razones, para no saturar el Alert de resultado. */
  skipReasons: string[];
}

function normalizeHeader(row: string[] | undefined): string[] {
  return (row ?? []).map((cell) => cell.trim().toLowerCase());
}

function parseAmountToCents(raw: string | undefined): number | null {
  const value = Number.parseFloat((raw ?? '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return toCents(value);
}

export interface ParsedCsv {
  /** Filas de datos, sin el encabezado. */
  rows: string[][];
  headerOk: boolean;
}

export function parseExpensesCsv(content: string): ParsedCsv {
  const allRows = parseCsv(content);
  const headerOk = JSON.stringify(normalizeHeader(allRows[0])) === JSON.stringify(EXPENSES_HEADER);
  return { rows: allRows.slice(1), headerOk };
}

export function parseBudgetEntriesCsv(content: string): ParsedCsv {
  const allRows = parseCsv(content);
  const headerOk =
    JSON.stringify(normalizeHeader(allRows[0])) === JSON.stringify(BUDGET_ENTRIES_HEADER);
  return { rows: allRows.slice(1), headerOk };
}

// Si la categoría del CSV no coincide con ninguna existente (ej. venía de
// una categoría personalizada que ya no existe, o un error de tipeo), el
// gasto se guarda en "Otros" (o la primera categoría disponible si esa no
// existe) y se conserva el nombre original al inicio de la nota, para no
// perder esa información.
export async function importExpensesFromCsv(
  db: SQLiteDatabase,
  projectId: number,
  categories: Category[],
  rows: string[][],
): Promise<ImportResult> {
  const categoryByName = new Map(
    categories.map((category) => [category.name.trim().toLowerCase(), category]),
  );
  const fallbackCategory =
    categoryByName.get('otros') ?? (categories.length > 0 ? categories[0] : undefined);

  let imported = 0;
  const skipReasons: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2; // +1 por el encabezado, +1 porque las filas son 1-based
    const [dateRaw, amountRaw, categoryNameRaw, noteRaw] = row;

    const date = (dateRaw ?? '').trim();
    if (!ISO_DATE_PATTERN.test(date)) {
      skipReasons.push(`Fila ${rowNumber}: fecha inválida ("${dateRaw ?? ''}")`);
      continue;
    }

    const amountCents = parseAmountToCents(amountRaw);
    if (amountCents === null) {
      skipReasons.push(`Fila ${rowNumber}: monto inválido ("${amountRaw ?? ''}")`);
      continue;
    }

    if (!fallbackCategory) {
      skipReasons.push(`Fila ${rowNumber}: el proyecto no tiene categorías`);
      continue;
    }

    const categoryName = (categoryNameRaw ?? '').trim();
    const matchedCategory = categoryByName.get(categoryName.toLowerCase());
    const note = (noteRaw ?? '').trim();

    const categoryId = matchedCategory ? matchedCategory.id : fallbackCategory.id;
    const finalNote = matchedCategory
      ? note || null
      : `[${categoryName || 'sin categoría'}] ${note}`.trim();

    await addExpense(db, {
      projectId,
      categoryId,
      date,
      amount: amountCents,
      note: finalNote || null,
    });
    imported += 1;
  }

  return { imported, skipped: skipReasons.length, skipReasons };
}

export async function importBudgetEntriesFromCsv(
  db: SQLiteDatabase,
  projectId: number,
  rows: string[][],
): Promise<ImportResult> {
  let imported = 0;
  const skipReasons: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const [dateRaw, typeRaw, amountRaw, noteRaw] = row;

    const date = (dateRaw ?? '').trim();
    if (!ISO_DATE_PATTERN.test(date)) {
      skipReasons.push(`Fila ${rowNumber}: fecha inválida ("${dateRaw ?? ''}")`);
      continue;
    }

    const amountCents = parseAmountToCents(amountRaw);
    if (amountCents === null) {
      skipReasons.push(`Fila ${rowNumber}: monto inválido ("${amountRaw ?? ''}")`);
      continue;
    }

    const type: BudgetEntryType =
      (typeRaw ?? '').trim().toLowerCase() === 'inicial' ? 'initial' : 'increase';

    await addBudgetEntry(db, {
      projectId,
      date,
      amount: amountCents,
      type,
      note: (noteRaw ?? '').trim() || null,
    });
    imported += 1;
  }

  return { imported, skipped: skipReasons.length, skipReasons };
}
