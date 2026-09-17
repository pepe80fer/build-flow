import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
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
      </Stack>
    </ThemeProvider>
  );
}
