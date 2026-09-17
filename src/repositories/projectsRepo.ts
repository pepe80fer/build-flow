import type { SQLiteDatabase } from 'expo-sqlite';

import type { Project } from '@/domain/types';

interface ProjectRow {
  id: number;
  name: string;
  type: string;
  currency: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Project['type'],
    currency: row.currency,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// El MVP siempre trabaja con un único proyecto (el que crea el seed).
// Este es el punto de extensión para la Entrega 3, cuando pueda haber varios:
// esa fase reemplazaría este "activo implícito" por selección explícita.
export async function getActiveProject(db: SQLiteDatabase): Promise<Project | null> {
  const row = await db.getFirstAsync<ProjectRow>(
    'SELECT * FROM projects WHERE is_archived = 0 ORDER BY id ASC LIMIT 1',
  );
  return row ? mapRow(row) : null;
}

export async function updateProject(
  db: SQLiteDatabase,
  id: number,
  patch: { name?: string; currency?: string },
): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, string | number | null> = { $id: id };

  if (patch.name !== undefined) {
    fields.push('name = $name');
    params.$name = patch.name;
  }
  if (patch.currency !== undefined) {
    fields.push('currency = $currency');
    params.$currency = patch.currency;
  }
  if (fields.length === 0) {
    return;
  }

  fields.push("updated_at = datetime('now')");
  await db.runAsync(`UPDATE projects SET ${fields.join(', ')} WHERE id = $id`, params);
}
