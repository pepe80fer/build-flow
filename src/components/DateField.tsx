import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateEs } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

// Selector de fecha nativo de Android (diálogo del sistema). Se usa la API
// imperativa `DateTimePickerAndroid.open` en vez del componente inline,
// que es la forma recomendada en Android (ver plan.md, app solo Android).
export function DateField({ label, value, onChange }: DateFieldProps) {
  const theme = useTheme();

  function openPicker() {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (_event, date) => {
        if (date) {
          onChange(date);
        }
      },
    });
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        onPress={openPicker}
        style={[styles.value, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText>{formatDateEs(value)}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  value: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
