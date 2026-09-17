import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { Expense } from '@/domain/types';
import { listExpenses } from '@/repositories/expensesRepo';

// Lista de gastos del proyecto, refrescada cada vez que la pantalla
// recupera el foco (ej. al volver de crear/editar/eliminar un gasto).
export function useExpenses(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (projectId === undefined) {
        return;
      }

      let isActive = true;
      setLoading(true);

      (async () => {
        const rows = await listExpenses(db, projectId);
        if (isActive) {
          setExpenses(rows);
          setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [db, projectId]),
  );

  return { expenses, loading };
}
