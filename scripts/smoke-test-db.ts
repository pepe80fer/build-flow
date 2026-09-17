// Smoke test manual de la capa de datos (tarea 1.6 del plan).
// Corre las migraciones, el seed y los repositorios reales contra una base
// SQLite en memoria (vía node:sqlite), sin necesitar un emulador Android.
// Uso: npm run db:smoke
import type { SQLiteDatabase } from 'expo-sqlite';

import { getAvailableBudget, getTotalBudget, getTotalSpent } from '../src/domain/calculations';
import { initializeDatabase } from '../src/db/client';
import { LATEST_DATABASE_VERSION, runMigrations } from '../src/db/migrations';
import { MIGRATION_001_INIT } from '../src/db/migrations/001_init';
import { DEFAULT_CATEGORIES } from '../src/db/seed';
import {
  addBudgetEntry,
  deleteBudgetEntry,
  listBudgetEntries,
  updateBudgetEntry,
} from '../src/repositories/budgetEntriesRepo';
import { listCategories } from '../src/repositories/categoriesRepo';
import {
  addExpense,
  deleteExpense,
  getExpenseById,
  listExpenses,
  updateExpense,
} from '../src/repositories/expensesRepo';
import { getActiveProject } from '../src/repositories/projectsRepo';
import { createNodeSqliteAdapter } from './nodeSqliteAdapter';

let passed = 0;
let failed = 0;

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  OK   ${label}`);
  } else {
    failed += 1;
    console.log(
      `  FAIL ${label} — esperado ${JSON.stringify(expected)}, obtuve ${JSON.stringify(actual)}`,
    );
  }
}

async function main(): Promise<void> {
  console.log('0. Migración incremental: v1 (ya instalada) -> v2 preserva datos existentes');
  // Simula un teléfono que ya tiene la app instalada en la versión anterior
  // (solo esquema v1, con datos reales guardados), para asegurar que la
  // migración 002 (columna photo_uri) no rompe ni pierde nada al aplicarse
  // sobre una base existente — a diferencia del resto de este smoke test,
  // que siempre arranca desde una base nueva vía initializeDatabase.
  const legacyDb = createNodeSqliteAdapter(':memory:') as unknown as SQLiteDatabase;
  await legacyDb.execAsync('PRAGMA foreign_keys = ON');
  await legacyDb.execAsync(MIGRATION_001_INIT);
  await legacyDb.execAsync('PRAGMA user_version = 1');

  const legacyProject = await legacyDb.runAsync(
    "INSERT INTO projects (name, type, currency) VALUES ('Mi Casa', 'construction', 'COP')",
  );
  const legacyProjectId = legacyProject.lastInsertRowId;
  const legacyCategory = await legacyDb.runAsync(
    `INSERT INTO categories (project_id, name, is_default, sort_order) VALUES (${legacyProjectId}, 'Materiales', 1, 0)`,
  );
  const legacyCategoryId = legacyCategory.lastInsertRowId;
  const legacyExpense = await legacyDb.runAsync(
    `INSERT INTO expenses (project_id, category_id, date, amount, note)
     VALUES (${legacyProjectId}, ${legacyCategoryId}, '2026-01-20', 500000, 'Gasto de antes de la migración')`,
  );
  const legacyExpenseId = legacyExpense.lastInsertRowId;

  await runMigrations(legacyDb);
  const versionAfterMigration = await legacyDb.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  assertEqual(
    versionAfterMigration?.user_version,
    LATEST_DATABASE_VERSION,
    'user_version llega a la última versión tras migrar desde v1',
  );

  const migratedExpense = await getExpenseById(legacyDb, legacyExpenseId);
  assertEqual(
    migratedExpense?.amount,
    500000,
    'el gasto anterior a la migración conserva su monto',
  );
  assertEqual(migratedExpense?.note, 'Gasto de antes de la migración', 'y su nota');
  assertEqual(migratedExpense?.photoUri, null, 'y su photo_uri nueva columna arranca en null');

  await updateExpense(legacyDb, legacyExpenseId, { photoUri: 'file:///receipts/example.jpg' });
  const expenseWithPhoto = await getExpenseById(legacyDb, legacyExpenseId);
  assertEqual(
    expenseWithPhoto?.photoUri,
    'file:///receipts/example.jpg',
    'se puede guardar una foto en un gasto migrado desde v1',
  );

  const db = createNodeSqliteAdapter(':memory:') as unknown as SQLiteDatabase;

  console.log('1. Inicialización (migraciones + seed)');
  await initializeDatabase(db);

  const project = await getActiveProject(db);
  assertEqual(project?.name, 'Mi Casa', 'proyecto por defecto creado');
  assertEqual(project?.currency, 'COP', 'moneda por defecto');
  if (!project) {
    throw new Error('No se pudo crear el proyecto default, abortando');
  }

  const categories = await listCategories(db, project.id);
  assertEqual(
    categories.length,
    DEFAULT_CATEGORIES.length,
    `se sembraron ${DEFAULT_CATEGORIES.length} categorías`,
  );
  assertEqual(categories[0]?.name, 'Materiales', 'primera categoría por sort_order');

  console.log('2. Presupuesto: inicial + incremento');
  const initialEntryId = await addBudgetEntry(db, {
    projectId: project.id,
    date: '2026-01-15',
    amount: 50_000_00, // $50,000.00
    type: 'initial',
  });
  await addBudgetEntry(db, {
    projectId: project.id,
    date: '2026-03-01',
    amount: 10_000_00, // $10,000.00
    type: 'increase',
    note: 'Ahorro extra',
  });

  let totalBudget = await getTotalBudget(db, project.id);
  assertEqual(totalBudget, 60_000_00, 'presupuesto total tras inicial + incremento');

  const entries = await listBudgetEntries(db, project.id);
  assertEqual(entries.length, 2, 'historial de presupuesto tiene 2 movimientos');

  await updateBudgetEntry(db, initialEntryId, { amount: 55_000_00 });
  totalBudget = await getTotalBudget(db, project.id);
  assertEqual(totalBudget, 65_000_00, 'presupuesto total tras editar el inicial');

  console.log('3. Gastos');
  const materialesCategoryId = categories.find((category) => category.name === 'Materiales')!.id;
  const transporteCategoryId = categories.find((category) => category.name === 'Transporte')!.id;

  const expenseId = await addExpense(db, {
    projectId: project.id,
    categoryId: materialesCategoryId,
    date: '2026-02-01',
    amount: 12_000_00,
    note: 'Cemento y varilla',
  });
  await addExpense(db, {
    projectId: project.id,
    categoryId: transporteCategoryId,
    date: '2026-02-05',
    amount: 1_500_00,
  });

  let totalSpent = await getTotalSpent(db, project.id);
  assertEqual(totalSpent, 13_500_00, 'total gastado tras 2 gastos');

  let available = await getAvailableBudget(db, project.id);
  assertEqual(available, 65_000_00 - 13_500_00, 'disponible = presupuesto - gastado');

  await updateExpense(db, expenseId, { amount: 12_500_00 });
  totalSpent = await getTotalSpent(db, project.id);
  assertEqual(totalSpent, 14_000_00, 'total gastado tras editar un gasto');

  await deleteExpense(db, expenseId);
  const remainingExpenses = await listExpenses(db, project.id);
  assertEqual(remainingExpenses.length, 1, 'queda 1 gasto tras eliminar uno');

  totalSpent = await getTotalSpent(db, project.id);
  available = await getAvailableBudget(db, project.id);
  assertEqual(totalSpent, 1_500_00, 'total gastado tras eliminar el gasto de materiales');
  assertEqual(available, 65_000_00 - 1_500_00, 'disponible recalculado tras eliminar gasto');

  console.log('4. Limpieza: eliminar un incremento de presupuesto');
  const increaseEntry = entries.find((entry) => entry.type === 'increase')!;
  await deleteBudgetEntry(db, increaseEntry.id);
  totalBudget = await getTotalBudget(db, project.id);
  assertEqual(totalBudget, 55_000_00, 'presupuesto total tras eliminar el incremento');

  console.log(`\n${passed} OK, ${failed} FAIL`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Smoke test crasheó:', error);
  process.exitCode = 1;
});
