import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';

// Home: resumen de presupuesto (total, gastado, disponible) en tiempo real,
// con acceso rápido a presupuesto y gastos. Si todavía no hay presupuesto
// inicial configurado, invita a configurarlo primero.
export default function HomeScreen() {
  const { project, loading: loadingProject } = useActiveProject();
  const { summary, loading: loadingSummary } = useBudgetSummary(project?.id);

  if (loadingProject || !project) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small">Cargando…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const hasInitialBudget = summary?.hasEntries ?? false;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">build-flow</ThemedText>

        {!loadingSummary && !hasInitialBudget && (
          <ThemedView type="backgroundElement" style={styles.ctaCard}>
            <ThemedText type="smallBold">Todavía no tienes presupuesto configurado</ThemedText>
            <Link href="/budget/increase">
              <ThemedText type="linkPrimary">Configurar presupuesto inicial</ThemedText>
            </Link>
          </ThemedView>
        )}

        {summary && hasInitialBudget && (
          <ThemedView style={styles.summaryGroup}>
            <BudgetSummaryCard
              label="Presupuesto total"
              cents={summary.totalBudget}
              currency={project.currency}
            />
            <BudgetSummaryCard
              label="Gastado"
              cents={summary.totalSpent}
              currency={project.currency}
            />
            <BudgetSummaryCard
              label="Disponible"
              cents={summary.available}
              currency={project.currency}
              emphasis={summary.available < 0 ? 'negative' : 'default'}
            />
          </ThemedView>
        )}

        <ThemedView type="backgroundElement" style={styles.linkGroup}>
          <Link href="/budget" style={styles.link}>
            <ThemedText type="link">Ver presupuesto</ThemedText>
          </Link>
          <Link href="/expenses" style={styles.link}>
            <ThemedText type="link">Ver gastos</ThemedText>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  ctaCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryGroup: {
    gap: Spacing.two,
  },
  linkGroup: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  link: {
    paddingVertical: Spacing.one,
  },
});
