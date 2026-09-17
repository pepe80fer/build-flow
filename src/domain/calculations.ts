import type { SQLiteDatabase } from 'expo-sqlite';

// Los montos siempre están en centavos (enteros) para evitar errores de
// punto flotante. El disponible no se guarda en ninguna tabla: se calcula
// en tiempo real como total de budget_entries menos total de expenses
// (ver plan.md, sección "Cálculo de disponible").

export async function getTotalBudget(db: SQLiteDatabase, projectId: number): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM budget_entries WHERE project_id = $projectId',
    { $projectId: projectId },
  );
  return row?.total ?? 0;
}

export async function getTotalSpent(db: SQLiteDatabase, projectId: number): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE project_id = $projectId',
    { $projectId: projectId },
  );
  return row?.total ?? 0;
}

export async function getAvailableBudget(db: SQLiteDatabase, projectId: number): Promise<number> {
  const [totalBudget, totalSpent] = await Promise.all([
    getTotalBudget(db, projectId),
    getTotalSpent(db, projectId),
  ]);
  return totalBudget - totalSpent;
}
