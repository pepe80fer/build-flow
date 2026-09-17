import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Alert, useColorScheme } from 'react-native';

import { DATABASE_NAME, initializeDatabase } from '@/db/client';

// Si falla la inicialización de la base de datos (migraciones/seed), es un
// error irrecuperable para esta sesión de la app: se avisa y se registra en
// consola en vez de dejar que crashee sin explicación.
function handleDatabaseError(error: Error): void {
  console.error('No se pudo iniciar la base de datos', error);
  Alert.alert(
    'No se pudo iniciar la app',
    'Cierra y vuelve a abrir la app. Si el problema persiste, contáctame.',
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={initializeDatabase}
      onError={handleDatabaseError}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'build-flow' }} />
          <Stack.Screen name="expenses/index" options={{ title: 'Gastos' }} />
          <Stack.Screen
            name="expenses/new"
            options={{ title: 'Nuevo gasto', presentation: 'modal' }}
          />
          <Stack.Screen
            name="expenses/[id]"
            options={{ title: 'Editar gasto', presentation: 'modal' }}
          />
          <Stack.Screen name="budget/index" options={{ title: 'Presupuesto' }} />
          <Stack.Screen
            name="budget/increase"
            options={{ title: 'Registrar incremento', presentation: 'modal' }}
          />
          <Stack.Screen name="reports/index" options={{ title: 'Reportes' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
