import type { SQLiteDatabase } from 'expo-sqlite';

import type { BudgetEntry, NewBudgetEntryInput, UpdateBudgetEntryInput } from '@/domain/types';

interface BudgetEntryRow {
  id: number;
  project_id: number;
  date: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: BudgetEntryRow): BudgetEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    amount: row.amount,
    type: row.type as BudgetEntry['type'],
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Incluye tanto el "inicial" como cada "incremento": es el historial completo
// del presupuesto, no solo el total (ver plan.md, tabla `budget_entries`).
export async function listBudgetEntries(
  db: SQLiteDatabase,
  projectId: number,
): Promise<BudgetEntry[]> {
  const rows = await db.getAllAsync<BudgetEntryRow>(
    'SELECT * FROM budget_entries WHERE project_id = $projectId ORDER BY date DESC, id DESC',
    { $projectId: projectId },
  );
  return rows.map(mapRow);
}

export async function addBudgetEntry(
  db: SQLiteDatabase,
  input: NewBudgetEntryInput,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO budget_entries (project_id, date, amount, type, note)
     VALUES ($projectId, $date, $amount, $type, $note)`,
    {
      $projectId: input.projectId,
      $date: input.date,
      $amount: input.amount,
      $type: input.type,
      $note: input.note ?? null,
    },
  );
  return result.lastInsertRowId;
}

export async function updateBudgetEntry(
  db: SQLiteDatabase,
  id: number,
  patch: UpdateBudgetEntryInput,
): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, string | number | null> = { $id: id };

  if (patch.date !== undefined) {
    fields.push('date = $date');
    params.$date = patch.date;
  }
  if (patch.amount !== undefined) {
    fields.push('amount = $amount');
    params.$amount = patch.amount;
  }
  if (patch.note !== undefined) {
    fields.push('note = $note');
    params.$note = patch.note;
  }
  if (fields.length === 0) {
    return;
  }

  fields.push("updated_at = datetime('now')");
  await db.runAsync(`UPDATE budget_entries SET ${fields.join(', ')} WHERE id = $id`, params);
}

export async function deleteBudgetEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM budget_entries WHERE id = $id', { $id: id });
}

export async function getBudgetEntryById(
  db: SQLiteDatabase,
  id: number,
): Promise<BudgetEntry | null> {
  const row = await db.getFirstAsync<BudgetEntryRow>(
    'SELECT * FROM budget_entries WHERE id = $id',
    {
      $id: id,
    },
  );
  return row ? mapRow(row) : null;
}

// El proyecto tiene a lo más un movimiento tipo 'initial'. Se usa para saber
// si ya se configuró el presupuesto inicial (ver src/app/budget/increase.tsx).
export async function getInitialBudgetEntry(
  db: SQLiteDatabase,
  projectId: number,
): Promise<BudgetEntry | null> {
  const row = await db.getFirstAsync<BudgetEntryRow>(
    "SELECT * FROM budget_entries WHERE project_id = $projectId AND type = 'initial' LIMIT 1",
    { $projectId: projectId },
  );
  return row ? mapRow(row) : null;
}

export async function countBudgetEntries(db: SQLiteDatabase, projectId: number): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM budget_entries WHERE project_id = $projectId',
    { $projectId: projectId },
  );
  return row?.count ?? 0;
}
