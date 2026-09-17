import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AmountField } from '@/components/AmountField';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { PhotoPicker } from '@/components/PhotoPicker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Category } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

export interface ExpenseFormValues {
  date: Date;
  amountText: string;
  categoryId: number | null;
  note: string;
  photoUri: string | null;
}

interface ExpenseFormProps {
  categories: Category[];
  values: ExpenseFormValues;
  onChangeValues: (values: ExpenseFormValues) => void;
  currency: string;
  onSubmit: () => void;
  onCancel: () => void;
  /** false = todavía no hay cambios que guardar: se oculta "Guardar" y el botón de salir dice "Volver". */
  canSubmit: boolean;
  onDelete?: () => void;
  submitLabel?: string;
}

// Formulario compartido por src/app/expenses/new.tsx y src/app/expenses/[id].tsx:
// fecha, monto, categoría (de la lista predefinida) y nota opcional.
export function ExpenseForm({
  categories,
  values,
  onChangeValues,
  currency,
  onSubmit,
  onCancel,
  canSubmit,
  onDelete,
  submitLabel = 'Guardar',
}: ExpenseFormProps) {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <DateField
        label="Fecha"
        value={values.date}
        onChange={(date) => onChangeValues({ ...values, date })}
      />
      <AmountField
        label="Monto"
        value={values.amountText}
        onChangeText={(amountText) => onChangeValues({ ...values, amountText })}
        currency={currency}
      />
      <CategoryPicker
        label="Categoría"
        categories={categories}
        selectedCategoryId={values.categoryId}
        onSelect={(categoryId) => onChangeValues({ ...values, categoryId })}
      />

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Nota (opcional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.noteInput,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
          value={values.note}
          onChangeText={(note) => onChangeValues({ ...values, note })}
          placeholder="Ej. Bulto de cemento en ferretería López…"
          placeholderTextColor={theme.textSecondary}
          multiline
        />
      </View>

      <PhotoPicker
        photoUri={values.photoUri}
        onChange={(photoUri) => onChangeValues({ ...values, photoUri })}
      />

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCancel}
          style={[styles.cancelButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">{canSubmit ? 'Cancelar' : 'Volver'}</ThemedText>
        </Pressable>
        {canSubmit && (
          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.text }]}
            onPress={onSubmit}
          >
            <ThemedText style={{ color: theme.background }} type="smallBold">
              {submitLabel}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {onDelete && (
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <ThemedText type="link" themeColor="danger">
            Eliminar
          </ThemedText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelButton: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
