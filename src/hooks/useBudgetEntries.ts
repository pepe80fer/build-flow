import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { BudgetEntry } from '@/domain/types';
import { listBudgetEntries } from '@/repositories/budgetEntriesRepo';

// Historial completo de movimientos de presupuesto (inicial + incrementos),
// refrescado cada vez que la pantalla recupera el foco, o al llamar
// `refetch()` manualmente (ej. después de importar un CSV sin navegar).
export function useBudgetEntries(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (projectId === undefined) {
      return;
    }
    setLoading(true);
    const rows = await listBudgetEntries(db, projectId);
    setEntries(rows);
    setLoading(false);
  }, [db, projectId]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { entries, loading, refetch };
}
