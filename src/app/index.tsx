import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { useTheme } from '@/hooks/use-theme';

// Home: resumen de presupuesto (total, gastado, disponible) en tiempo real,
// con acceso rápido a presupuesto y gastos. Si todavía no hay presupuesto
// inicial configurado, invita a configurarlo primero.
export default function HomeScreen() {
  const theme = useTheme();
  const { project, loading: loadingProject } = useActiveProject();
  const { summary, loading: loadingSummary } = useBudgetSummary(project?.id);
  const [amountsHidden, setAmountsHidden] = useState(false);

  if (loadingProject || !project) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
          <ThemedText type="small">Cargando…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const hasInitialBudget = summary?.hasEntries ?? false;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ThemedText type="title">Casa Huila Ma</ThemedText>

        {!loadingSummary && !hasInitialBudget && (
          <ThemedView type="backgroundElement" style={styles.ctaCard}>
            <ThemedText type="smallBold">Todavía no tienes presupuesto configurado</ThemedText>
            <Link href="/budget/increase" style={styles.link}>
              <ThemedText type="linkPrimary">Configurar presupuesto inicial</ThemedText>
            </Link>
          </ThemedView>
        )}

        {summary && hasInitialBudget && (
          <View>
            <View style={styles.summaryHeader}>
              <Pressable
                onPress={() => setAmountsHidden((current) => !current)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={amountsHidden ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            <ThemedView style={styles.summaryGroup}>
              <BudgetSummaryCard
                label="Presupuesto total"
                cents={summary.totalBudget}
                currency={project.currency}
                hidden={amountsHidden}
              />
              <BudgetSummaryCard
                label="Gastado"
                cents={summary.totalSpent}
                currency={project.currency}
                hidden={amountsHidden}
              />
              <BudgetSummaryCard
                label="Disponible"
                cents={summary.available}
                currency={project.currency}
                emphasis={summary.available < 0 ? 'negative' : 'default'}
                hidden={amountsHidden}
              />
            </ThemedView>
          </View>
        )}

        <ThemedView type="backgroundElement" style={styles.linkGroup}>
          <Link href="/budget" style={styles.link}>
            <ThemedText type="link">Ver presupuesto</ThemedText>
          </Link>
          <Link href="/expenses" style={styles.link}>
            <ThemedText type="link">Ver gastos</ThemedText>
          </Link>
          <Link href="/reports" style={styles.link}>
            <ThemedText type="link">Ver reportes</ThemedText>
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  eyeButton: {
    padding: Spacing.one,
  },
  summaryGroup: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  linkGroup: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  link: {
    paddingVertical: Spacing.two,
  },
});
