import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
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

type IoniconName = keyof typeof Ionicons.glyphMap;

const NAV_ITEMS: {
  href: '/budget' | '/expenses' | '/reports';
  label: string;
  icon: IoniconName;
}[] = [
  { href: '/budget', label: 'Ver presupuesto', icon: 'wallet-outline' },
  { href: '/expenses', label: 'Ver gastos', icon: 'receipt-outline' },
  { href: '/reports', label: 'Ver reportes', icon: 'stats-chart-outline' },
];

// Home: resumen de presupuesto (total, gastado, disponible) en tiempo real,
// con acceso rápido a presupuesto y gastos. Si todavía no hay presupuesto
// inicial configurado, invita a configurarlo primero.
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
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

        <View style={styles.navGroup}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={[styles.navButton, { backgroundColor: theme.backgroundElement }]}
            >
              <Ionicons name={item.icon} size={20} color={theme.text} />
              <ThemedText type="smallBold" style={styles.navButtonLabel}>
                {item.label}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>
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
  navGroup: {
    gap: Spacing.two,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  navButtonLabel: {
    flex: 1,
  },
  link: {
    paddingVertical: Spacing.two,
  },
});
