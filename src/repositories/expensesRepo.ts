import type { SQLiteDatabase } from 'expo-sqlite';

import type { Expense, NewExpenseInput, UpdateExpenseInput } from '@/domain/types';

interface ExpenseRow {
  id: number;
  project_id: number;
  category_id: number;
  date: string;
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    projectId: row.project_id,
    categoryId: row.category_id,
    date: row.date,
    amount: row.amount,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listExpenses(db: SQLiteDatabase, projectId: number): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE project_id = $projectId ORDER BY date DESC, id DESC',
    { $projectId: projectId },
  );
  return rows.map(mapRow);
}

export async function getExpenseById(db: SQLiteDatabase, id: number): Promise<Expense | null> {
  const row = await db.getFirstAsync<ExpenseRow>('SELECT * FROM expenses WHERE id = $id', {
    $id: id,
  });
  return row ? mapRow(row) : null;
}

export async function addExpense(db: SQLiteDatabase, input: NewExpenseInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO expenses (project_id, category_id, date, amount, note)
     VALUES ($projectId, $categoryId, $date, $amount, $note)`,
    {
      $projectId: input.projectId,
      $categoryId: input.categoryId,
      $date: input.date,
      $amount: input.amount,
      $note: input.note ?? null,
    },
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  patch: UpdateExpenseInput,
): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, string | number | null> = { $id: id };

  if (patch.categoryId !== undefined) {
    fields.push('category_id = $categoryId');
    params.$categoryId = patch.categoryId;
  }
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
  await db.runAsync(`UPDATE expenses SET ${fields.join(', ')} WHERE id = $id`, params);
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = $id', { $id: id });
}
