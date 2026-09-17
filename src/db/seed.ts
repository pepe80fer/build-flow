import type { SQLiteDatabase } from 'expo-sqlite';

// Categorías predefinidas de construcción, en el orden en que se muestran.
export const DEFAULT_CATEGORIES = [
  'Materiales',
  'Mano de obra',
  'Maquinaria/herramientas',
  'Transporte',
  'Permisos y trámites',
  'Servicios profesionales',
  'Mantenimiento',
  'Imprevistos',
  'Otros',
];

const DEFAULT_PROJECT_NAME = 'Mi Casa';
const DEFAULT_PROJECT_TYPE = 'construction';
const DEFAULT_CURRENCY = 'COP';

// El MVP trabaja con un único proyecto, creado automáticamente y oculto en
// la UI (ver plan.md, sección "Modelo de datos"). Esta función es idempotente:
// solo siembra datos si la tabla `projects` está vacía, así que es seguro
// llamarla en cada arranque de la app.
export async function seedDefaultProjectIfNeeded(db: SQLiteDatabase): Promise<void> {
  const existingProject = await db.getFirstAsync<{ id: number }>('SELECT id FROM projects LIMIT 1');
  if (existingProject) {
    return;
  }

  const projectResult = await db.runAsync(
    'INSERT INTO projects (name, type, currency) VALUES ($name, $type, $currency)',
    { $name: DEFAULT_PROJECT_NAME, $type: DEFAULT_PROJECT_TYPE, $currency: DEFAULT_CURRENCY },
  );
  const projectId = projectResult.lastInsertRowId;

  for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
    await db.runAsync(
      'INSERT INTO categories (project_id, name, is_default, sort_order) VALUES ($projectId, $name, 1, $sortOrder)',
      { $projectId: projectId, $name: name, $sortOrder: index },
    );
  }
}
