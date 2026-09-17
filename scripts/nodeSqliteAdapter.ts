// Adaptador que envuelve el módulo `node:sqlite` (incluido en Node 22+) con la
// misma forma async que usan nuestros repositorios/migraciones/seed
// (execAsync, runAsync, getFirstAsync, getAllAsync). Como los archivos de
// src/db y src/repositories solo importan el TIPO `SQLiteDatabase` de
// `expo-sqlite` (se borra al compilar), podemos correr esa misma lógica
// aquí en Node puro para el smoke test, sin necesitar un emulador Android.
//
// Solo para uso en scripts/ de desarrollo — no es parte de la app.
import { DatabaseSync } from 'node:sqlite';

type BindParams = Record<string, string | number | null> | undefined;

export function createNodeSqliteAdapter(databasePath: string = ':memory:') {
  const db = new DatabaseSync(databasePath);

  return {
    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
    },
    async runAsync(
      sql: string,
      params?: BindParams,
    ): Promise<{ lastInsertRowId: number; changes: number }> {
      const stmt = db.prepare(sql);
      const result = params ? stmt.run(params) : stmt.run();
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async getFirstAsync<T>(sql: string, params?: BindParams): Promise<T | null> {
      const stmt = db.prepare(sql);
      const row = params ? stmt.get(params) : stmt.get();
      return (row as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params?: BindParams): Promise<T[]> {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(params) : stmt.all();
      return rows as T[];
    },
  };
}
