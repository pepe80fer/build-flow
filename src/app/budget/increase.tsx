import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountField } from '@/components/AmountField';
import { DateField } from '@/components/DateField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useTheme } from '@/hooks/use-theme';
import {
  addBudgetEntry,
  deleteBudgetEntry,
  getBudgetEntryById,
  getInitialBudgetEntry,
  updateBudgetEntry,
} from '@/repositories/budgetEntriesRepo';
import { updateProject } from '@/repositories/projectsRepo';
import { useAppStore } from '@/store/useAppStore';
import { fromISODateString, toISODateString } from '@/utils/date';
import { alertUnexpectedError } from '@/utils/errors';
import { fromCents, toCents } from '@/utils/money';

// Formulario único para crear o editar un movimiento de presupuesto.
// Sirve tanto para "configurar el presupuesto inicial" (primer movimiento
// del proyecto, con selector de moneda) como para "registrar un incremento"
// posterior, y también para editar/eliminar cualquiera de los dos —
// ver plan.md, tareas 2.1, 2.4 y 2.5.
export default function BudgetEntryFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { project } = useActiveProject();
  const setActiveProject = useAppStore((state) => state.setActiveProject);

  const editingId = id ? Number(id) : undefined;
  const isEditing = editingId !== undefined;

  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [isInitial, setIsInitial] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');

  useEffect(() => {
    if (!project) {
      return;
    }

    let isActive = true;

    (async () => {
      try {
        if (editingId !== undefined) {
          const entry = await getBudgetEntryById(db, editingId);
          if (!isActive) {
            return;
          }
          if (!entry) {
            Alert.alert('Movimiento no encontrado', 'Es posible que ya se haya eliminado.');
            router.back();
            return;
          }
          setIsInitial(entry.type === 'initial');
          setDate(fromISODateString(entry.date));
          setAmountText(String(fromCents(entry.amount)));
          setNote(entry.note ?? '');
        } else {
          const initialEntry = await getInitialBudgetEntry(db, project.id);
          if (isActive) {
            setIsInitial(initialEntry === null);
            setCurrencyCode(project.currency);
          }
        }
        if (isActive) {
          setStatus('ready');
        }
      } catch (error) {
        if (isActive) {
          alertUnexpectedError('No se pudo cargar el presupuesto', error);
          router.back();
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [db, editingId, project, router]);

  useEffect(() => {
    const title = isEditing
      ? isInitial
        ? 'Editar presupuesto inicial'
        : 'Editar incremento'
      : isInitial
        ? 'Configurar presupuesto inicial'
        : 'Registrar incremento';
    navigation.setOptions({ title });
  }, [navigation, isEditing, isInitial]);

  if (!project || status === 'loading') {
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

    const amountNumber = Number.parseFloat(amountText.replace(',', '.'));
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }

    let trimmedCurrency = project.currency;
    if (!isEditing && isInitial) {
      trimmedCurrency = currencyCode.trim().toUpperCase();
      if (trimmedCurrency.length !== 3) {
        Alert.alert('Moneda inválida', 'Ingresa un código de moneda ISO de 3 letras, ej. COP.');
        return;
      }
    }

    const isoDate = toISODateString(date);
    const amountCents = toCents(amountNumber);
    const noteToSave = note.trim() ? note.trim() : null;

    try {
      if (isEditing && editingId !== undefined) {
        await updateBudgetEntry(db, editingId, {
          date: isoDate,
          amount: amountCents,
          note: noteToSave,
        });
      } else if (isInitial) {
        if (trimmedCurrency !== project.currency) {
          await updateProject(db, project.id, { currency: trimmedCurrency });
          setActiveProject({ ...project, currency: trimmedCurrency });
        }
        await addBudgetEntry(db, {
          projectId: project.id,
          date: isoDate,
          amount: amountCents,
          type: 'initial',
          note: noteToSave,
        });
      } else {
        await addBudgetEntry(db, {
          projectId: project.id,
          date: isoDate,
          amount: amountCents,
          type: 'increase',
          note: noteToSave,
        });
      }
      router.back();
    } catch (error) {
      alertUnexpectedError('No se pudo guardar el presupuesto', error);
    }
  }

  function handleDelete() {
    if (editingId === undefined) {
      return;
    }
    Alert.alert(
      'Eliminar movimiento',
      '¿Seguro que quieres eliminar este movimiento de presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudgetEntry(db, editingId);
              router.back();
            } catch (error) {
              alertUnexpectedError('No se pudo eliminar el movimiento', error);
            }
          },
        },
      ],
    );
  }

  const showCurrencyField = !isEditing && isInitial;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <DateField label="Fecha" value={date} onChange={setDate} />
          <AmountField
            label="Monto"
            value={amountText}
            onChangeText={setAmountText}
            currency={showCurrencyField ? undefined : project.currency}
          />

          {showCurrencyField && (
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                Moneda (código ISO, ej. COP, USD, EUR)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                value={currencyCode}
                onChangeText={setCurrencyCode}
                autoCapitalize="characters"
                maxLength={3}
              />
            </View>
          )}

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
              value={note}
              onChangeText={setNote}
              placeholder="Ej. Ahorro extra, venta de terreno…"
              placeholderTextColor={theme.textSecondary}
              multiline
            />
          </View>

          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.text }]}
            onPress={handleSubmit}
          >
            <ThemedText style={{ color: theme.background }} type="smallBold">
              Guardar
            </ThemedText>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <ThemedText type="link" themeColor="danger">
                Eliminar
              </ThemedText>
            </Pressable>
          )}
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
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
