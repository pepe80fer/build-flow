import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Category } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

interface CategoryPickerProps {
  label: string;
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (categoryId: number) => void;
}

// Selector simple de categoría: al tocar el campo se abre la lista completa
// en una hoja modal y se elige una. Pensado para uso rápido en obra (pocas
// categorías predefinidas, sin necesidad de buscador).
export function CategoryPicker({
  label,
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryPickerProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={[styles.value, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText themeColor={selectedCategory ? undefined : 'textSecondary'}>
          {selectedCategory?.name ?? 'Selecciona una categoría'}
        </ThemedText>
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.id === selectedCategoryId && {
                      backgroundColor: theme.backgroundSelected,
                    },
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                  }}
                >
                  <ThemedText>{item.name}</ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  value: {
    borderRadius: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    maxHeight: '70%',
  },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
