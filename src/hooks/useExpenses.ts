import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { Expense } from '@/domain/types';
import { listExpenses } from '@/repositories/expensesRepo';

// Lista de gastos del proyecto, refrescada cada vez que la pantalla
// recupera el foco (ej. al volver de crear/editar/eliminar un gasto), o al
// llamar `refetch()` manualmente (ej. después de importar un CSV sin
// navegar a otra pantalla).
export function useExpenses(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (projectId === undefined) {
      return;
    }
    setLoading(true);
    const rows = await listExpenses(db, projectId);
    setExpenses(rows);
    setLoading(false);
  }, [db, projectId]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { expenses, loading, refetch };
}
