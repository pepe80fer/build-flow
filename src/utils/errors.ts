import { Alert } from 'react-native';

// Manejo básico de errores para el MVP: se loguea para depurar y se muestra
// un Alert simple al usuario. No hay telemetría/reporte remoto todavía —
// es uso personal, así que la consola + un aviso en pantalla es suficiente.
export function alertUnexpectedError(title: string, error: unknown): void {
  console.error(title, error);
  Alert.alert(title, error instanceof Error ? error.message : 'Intenta de nuevo en un momento.');
}
