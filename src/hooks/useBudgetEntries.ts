import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { BudgetEntry } from '@/domain/types';
import { listBudgetEntries } from '@/repositories/budgetEntriesRepo';

// Historial completo de movimientos de presupuesto (inicial + incrementos),
// refrescado cada vez que la pantalla recupera el foco.
export function useBudgetEntries(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (projectId === undefined) {
        return;
      }

      let isActive = true;
      setLoading(true);

      (async () => {
        const rows = await listBudgetEntries(db, projectId);
        if (isActive) {
          setEntries(rows);
          setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [db, projectId]),
  );

  return { entries, loading };
}
