import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpenseForm, type ExpenseFormValues } from '@/components/ExpenseForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useCategories } from '@/hooks/useCategories';
import { deleteExpense, getExpenseById, updateExpense } from '@/repositories/expensesRepo';
import { fromISODateString, toISODateString } from '@/utils/date';
import { alertUnexpectedError } from '@/utils/errors';
import { fromCents, toCents } from '@/utils/money';

// Editar/eliminar un gasto existente.
export default function EditExpenseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = Number(id);
  const { project } = useActiveProject();
  const { categories, loading: loadingCategories } = useCategories(project?.id);

  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [values, setValues] = useState<ExpenseFormValues>({
    date: new Date(),
    amountText: '',
    categoryId: null,
    note: '',
  });

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const expense = await getExpenseById(db, expenseId);
        if (!isActive) {
          return;
        }
        if (!expense) {
          Alert.alert('Gasto no encontrado', 'Es posible que ya se haya eliminado.');
          router.back();
          return;
        }
        setValues({
          date: fromISODateString(expense.date),
          amountText: String(fromCents(expense.amount)),
          categoryId: expense.categoryId,
          note: expense.note ?? '',
        });
        setStatus('ready');
      } catch (error) {
        if (isActive) {
          alertUnexpectedError('No se pudo cargar el gasto', error);
          router.back();
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [db, expenseId, router]);

  if (!project || loadingCategories || status === 'loading') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small">Cargando…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  async function handleSubmit() {
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
      await updateExpense(db, expenseId, {
        categoryId: values.categoryId,
        date: toISODateString(values.date),
        amount: toCents(amountNumber),
        note: values.note.trim() ? values.note.trim() : null,
      });
      router.back();
    } catch (error) {
      alertUnexpectedError('No se pudo guardar el gasto', error);
    }
  }

  function handleDelete() {
    Alert.alert('Eliminar gasto', '¿Seguro que quieres eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(db, expenseId);
            router.back();
          } catch (error) {
            alertUnexpectedError('No se pudo eliminar el gasto', error);
          }
        },
      },
    ]);
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
          onDelete={handleDelete}
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
