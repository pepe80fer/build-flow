import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AmountFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
}

// Input de monto en unidades "humanas" (ej. "1500.50"), no en centavos: la
// conversión a centavos ocurre al guardar (ver src/utils/money.ts).
export function AmountField({ label, value, onChangeText, currency }: AmountFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
        {currency ? ` (${currency})` : ''}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="0.00"
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
