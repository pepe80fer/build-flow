import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpenseForm, type ExpenseFormValues } from '@/components/ExpenseForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useCategories } from '@/hooks/useCategories';
import { addExpense } from '@/repositories/expensesRepo';
import { toISODateString } from '@/utils/date';
import { alertUnexpectedError } from '@/utils/errors';
import { toCents } from '@/utils/money';

// Formulario "Nuevo gasto": fecha, monto, categoría y nota opcional.
export default function NewExpenseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { project } = useActiveProject();
  const { categories, loading: loadingCategories } = useCategories(project?.id);

  const [values, setValues] = useState<ExpenseFormValues>({
    date: new Date(),
    amountText: '',
    categoryId: null,
    note: '',
    photoUri: null,
  });

  if (!project || loadingCategories) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small">Cargando…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  async function handleSubmit() {
    if (!project) {
      return;
    }

    const amountNumber = Number.parseFloat(values.amountText.replace(',', '.'));
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (values.categoryId === null) {
      Alert.alert('Falta la categoría', 'Selecciona una categoría para el gasto.');
      return;
    }

    try {
      await addExpense(db, {
        projectId: project.id,
        categoryId: values.categoryId,
        date: toISODateString(values.date),
        amount: toCents(amountNumber),
        note: values.note.trim() ? values.note.trim() : null,
        photoUri: values.photoUri,
      });
      router.back();
    } catch (error) {
      alertUnexpectedError('No se pudo guardar el gasto', error);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ExpenseForm
          categories={categories}
          values={values}
          onChangeValues={setValues}
          currency={project.currency}
          onSubmit={handleSubmit}
        />
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
});
