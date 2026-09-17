import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATION_001_INIT } from './001_init';

// Cada entrada es el SQL para llegar a esa versión de esquema (índice 0 -> versión 1).
// Para agregar cambios futuros (ej. columna `photo_uri` en `expenses` para la Entrega 2),
// se agrega un nuevo archivo `00N_algo.ts` y se agrega aquí al final del arreglo.
const MIGRATIONS: string[] = [MIGRATION_001_INIT];

export const LATEST_DATABASE_VERSION = MIGRATIONS.length;

// Corre las migraciones pendientes según `PRAGMA user_version`. Idempotente:
// si la base ya está en la última versión, no hace nada.
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  for (let version = currentVersion + 1; version <= LATEST_DATABASE_VERSION; version += 1) {
    const migrationSql = MIGRATIONS[version - 1];
    await db.execAsync(migrationSql);
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
