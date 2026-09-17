import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category } from '@/domain/types';

interface CategoryRow {
  id: number;
  project_id: number;
  name: string;
  is_default: number;
  sort_order: number;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
  };
}

export async function listCategories(db: SQLiteDatabase, projectId: number): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE project_id = $projectId ORDER BY sort_order ASC',
    { $projectId: projectId },
  );
  return rows.map(mapRow);
}
