import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveReceiptPhoto } from '@/utils/photos';

interface PhotoPickerProps {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
}

// Adjuntar foto del recibo: tomar foto con la cámara o elegir de galería.
// La foto se copia a una carpeta persistente de la app (src/utils/photos.ts)
// antes de guardar su ruta; el archivo temporal original puede desaparecer
// sin afectar al gasto. El borrado del archivo (al reemplazar o eliminar el
// gasto) lo maneja la pantalla que usa este componente, no este componente.
export function PhotoPicker({ photoUri, onChange }: PhotoPickerProps) {
  const theme = useTheme();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function pickFrom(source: 'camera' | 'library') {
    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permiso necesario',
        source === 'camera'
          ? 'Necesitas dar permiso de cámara para tomar la foto.'
          : 'Necesitas dar permiso de galería para elegir una foto.',
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    setIsSaving(true);
    try {
      const savedUri = await saveReceiptPhoto(result.assets[0].uri);
      onChange(savedUri);
    } catch (error) {
      console.error('No se pudo guardar la foto del recibo', error);
      Alert.alert('No se pudo guardar la foto', 'Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemove() {
    Alert.alert('Quitar foto', '¿Seguro que quieres quitar la foto de este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => onChange(null) },
    ]);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Foto del recibo (opcional)
      </ThemedText>

      {photoUri ? (
        <View style={styles.photoRow}>
          <Pressable onPress={() => setIsViewerOpen(true)}>
            <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
          </Pressable>
          <Pressable onPress={handleRemove} style={styles.removeButton}>
            <ThemedText type="link" themeColor="danger">
              Quitar
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <Pressable
            onPress={() => pickFrom('camera')}
            disabled={isSaving}
            style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">Tomar foto</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => pickFrom('library')}
            disabled={isSaving}
            style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">Galería</ThemedText>
          </Pressable>
        </View>
      )}

      <Modal
        visible={isViewerOpen}
        animationType="fade"
        onRequestClose={() => setIsViewerOpen(false)}
      >
        <Pressable
          style={[styles.viewerBackdrop, { backgroundColor: theme.background }]}
          onPress={() => setIsViewerOpen(false)}
        >
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.viewerImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: Spacing.two,
  },
  removeButton: {
    paddingVertical: Spacing.two,
  },
  viewerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});
