import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getTotalBudget, getTotalSpent } from '@/domain/calculations';
import { countBudgetEntries } from '@/repositories/budgetEntriesRepo';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  available: number;
  /** false si todavía no se registró el presupuesto inicial. */
  hasEntries: boolean;
}

// Se recalcula cada vez que la pantalla que lo usa recupera el foco (ej. al
// volver de registrar un gasto o un incremento de presupuesto), o al llamar
// `refetch()` manualmente (ej. después de importar un CSV sin navegar) —
// así el resumen siempre refleja el estado real sin necesitar un sistema de
// cache/invalidación más elaborado.
export function useBudgetSummary(projectId: number | undefined) {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (projectId === undefined) {
      return;
    }
    setLoading(true);
    const [totalBudget, totalSpent, entryCount] = await Promise.all([
      getTotalBudget(db, projectId),
      getTotalSpent(db, projectId),
      countBudgetEntries(db, projectId),
    ]);
    setSummary({
      totalBudget,
      totalSpent,
      available: totalBudget - totalSpent,
      hasEntries: entryCount > 0,
    });
    setLoading(false);
  }, [db, projectId]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { summary, loading, refetch };
}
