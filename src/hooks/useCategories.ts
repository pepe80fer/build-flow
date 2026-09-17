import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import type { Category } from '@/domain/types';
import { listCategories } from '@/repositories/categoriesRepo';

// Las categorías del proyecto se siembran una sola vez al crearlo y rara
// vez cambian en el MVP, así que basta cargarlas cuando cambia el proyecto
// (no hace falta refrescar en cada foco de pantalla como con los gastos).
export function useCategories(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId === undefined) {
      return;
    }

    let isMounted = true;
    (async () => {
      const rows = await listCategories(db, projectId);
      if (isMounted) {
        setCategories(rows);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [db, projectId]);

  return { categories, loading };
}
