import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatAmount } from '@/utils/money';

interface BudgetSummaryCardProps {
  label: string;
  cents: number;
  currency: string;
  /** 'negative' resalta el monto (ej. disponible que quedó en rojo). */
  emphasis?: 'default' | 'negative';
  /** true = muestra un placeholder en vez del monto (privacidad rápida). */
  hidden?: boolean;
}

export function BudgetSummaryCard({
  label,
  cents,
  currency,
  emphasis = 'default',
  hidden = false,
}: BudgetSummaryCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" themeColor={emphasis === 'negative' ? 'danger' : undefined}>
        {hidden ? '••••••' : formatAmount(cents, currency)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
