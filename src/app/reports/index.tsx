import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartColors, Spacing } from '@/constants/theme';
import {
  filterExpensesByRange,
  getCategoryBreakdown,
  getCumulativeSpendSeries,
  getPeriodRange,
  type ReportPeriod,
} from '@/domain/reports';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useTheme } from '@/hooks/use-theme';
import { fromCents } from '@/utils/money';

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todo' },
];

// Reportes y gráficos: total gastado en el período (semana/mes/todo),
// gasto por categoría, y la curva de gasto acumulado contra el
// presupuesto total (esta última siempre con el historial completo,
// independiente del período seleccionado).
export default function ReportsScreen() {
  const theme = useTheme();
  const { project } = useActiveProject();
  const { expenses, loading: loadingExpenses } = useExpenses(project?.id);
  const { categories } = useCategories(project?.id);
  const { summary } = useBudgetSummary(project?.id);

  const [period, setPeriod] = useState<ReportPeriod>('month');

  const range = useMemo(() => getPeriodRange(period, new Date()), [period]);
  const expensesInPeriod = useMemo(() => filterExpensesByRange(expenses, range), [expenses, range]);
  const totalInPeriod = useMemo(
    () => expensesInPeriod.reduce((sum, expense) => sum + expense.amount, 0),
    [expensesInPeriod],
  );
  const breakdown = useMemo(
    () => getCategoryBreakdown(expensesInPeriod, categories),
    [expensesInPeriod, categories],
  );
  const cumulativeSeries = useMemo(() => getCumulativeSpendSeries(expenses), [expenses]);

  if (!project) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small">Cargando…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const pieData = breakdown.map((item, index) => ({
    value: fromCents(item.total),
    color: ChartColors[index % ChartColors.length],
  }));

  const totalBudget = fromCents(summary?.totalBudget ?? 0);
  const cumulativeData = cumulativeSeries.map((point) => ({ value: fromCents(point.cumulative) }));
  const budgetLineData = cumulativeSeries.map(() => ({ value: totalBudget }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Reportes</ThemedText>

          <View style={styles.periodSelector}>
            {PERIOD_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPeriod(option.value)}
                style={[
                  styles.periodOption,
                  { backgroundColor: theme.backgroundElement },
                  period === option.value && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText type="smallBold">{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <BudgetSummaryCard
            label={`Gastado (${PERIOD_OPTIONS.find((option) => option.value === period)?.label})`}
            cents={totalInPeriod}
            currency={project.currency}
          />

          <View style={styles.section}>
            <ThemedText type="smallBold">Gasto por categoría</ThemedText>
            {!loadingExpenses && breakdown.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                No hay gastos en este período.
              </ThemedText>
            )}
            {breakdown.length > 0 && (
              <>
                <View style={styles.pieContainer}>
                  <PieChart data={pieData} donut radius={90} innerRadius={55} />
                </View>
                <View style={styles.legend}>
                  {breakdown.map((item, index) => (
                    <View key={item.categoryId} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendSwatch,
                          { backgroundColor: ChartColors[index % ChartColors.length] },
                        ]}
                      />
                      <ThemedText type="small" style={styles.legendLabel}>
                        {item.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {((item.total / totalInPeriod) * 100).toFixed(0)}%
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Gasto acumulado vs presupuesto total</ThemedText>
            {cumulativeSeries.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Todavía no hay gastos para mostrar la curva.
              </ThemedText>
            ) : (
              <>
                <ScrollView horizontal contentContainerStyle={styles.lineChartScroll}>
                  <LineChart
                    data={cumulativeData}
                    data2={budgetLineData}
                    color1={theme.text}
                    color2={theme.danger}
                    thickness1={3}
                    thickness2={2}
                    strokeDashArray2={[6, 4]}
                    hideDataPoints
                    hideDataPoints2
                    hideYAxisText
                    xAxisLabelTexts={cumulativeSeries.map(() => '')}
                    spacing={Math.max(16, 220 / Math.max(cumulativeSeries.length, 1))}
                    initialSpacing={Spacing.two}
                    height={160}
                  />
                </ScrollView>
                <View style={styles.legendRow}>
                  <View style={[styles.legendSwatch, { backgroundColor: theme.text }]} />
                  <ThemedText type="small" style={styles.legendLabel}>
                    Gastado acumulado
                  </ThemedText>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendSwatch, { backgroundColor: theme.danger }]} />
                  <ThemedText type="small" style={styles.legendLabel}>
                    Presupuesto total
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </ScrollView>
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
  },
  content: {
    gap: Spacing.three,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  periodOption: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  pieContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  legend: {
    gap: Spacing.one,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
  },
  lineChartScroll: {
    paddingRight: Spacing.four,
  },
});
