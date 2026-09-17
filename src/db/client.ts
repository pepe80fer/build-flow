import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';
import { seedDefaultProjectIfNeeded } from './seed';

export const DATABASE_NAME = 'build-flow.db';

// Handler que se pasa a <SQLiteProvider onInit={...}> en src/app/_layout.tsx.
// Corre una sola vez, antes de que la app renderice sus pantallas: prepara
// pragmas básicos, aplica migraciones pendientes y siembra el proyecto por
// defecto si es la primera vez que se abre la app.
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await runMigrations(db);
  await seedDefaultProjectIfNeeded(db);
}
