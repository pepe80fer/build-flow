# Casa Huila Ma (build-flow)

App móvil personal (React Native + Expo, Android) para llevar el control de gastos de la construcción de una vivienda contra un presupuesto que puede aumentar con el tiempo.

El plan de desarrollo completo (decisiones, modelo de datos, fases y tareas) está en [`plan.md`](./plan.md).

## Estado

MVP completo (Fases 0-6) + Entrega 2 completa (Fases 7-8):

- Presupuesto inicial configurable (monto, moneda ISO, fecha), con historial completo de incrementos posteriores — editable y eliminable.
- Registro de gastos por categoría predefinida de construcción (con "Otros" + nota libre), con fecha, monto, nota y foto del recibo opcionales.
- Presupuesto total, gastado y disponible en tiempo real, con opción de ocultarlos rápidamente (ícono de ojo).
- Reportes: gasto por categoría y curva de gasto acumulado vs presupuesto, navegables por semana/mes.
- Buscador y filtro por categoría en la lista de gastos.
- Exportar/importar gastos e historial de presupuesto en CSV (ver "Datos y respaldo").

## Datos y respaldo

Todos los datos viven **únicamente en SQLite local, en tu teléfono** — no hay backend ni sincronización en la nube (ver `plan.md` para la evolución futura contemplada). Esto significa:

- Si **desinstalas** la app (o pierdes el teléfono), pierdes los datos. Actualizar la app instalando un nuevo `.apk` **sin desinstalar primero** sí conserva los datos — ver "Actualizar la app instalada" más abajo.
- El respaldo es manual: el botón **"Exportar"** (ícono de descarga) en Gastos y en Presupuesto genera un CSV que puedes compartir a Drive, correo, etc.
- El botón **"Importar"** (ícono de documento, junto a "Exportar") lee ese mismo CSV y vuelve a crear los registros — es la forma de recuperar los datos si alguna vez se pierde la base local. Si una fila trae una categoría que ya no existe, el gasto se guarda en "Otros" conservando el nombre original al inicio de la nota, para no perder esa información. Importar el mismo CSV dos veces duplica los registros — está pensado como recuperación puntual, no como sincronización.
- **El CSV no incluye las fotos de los recibos.** Cuando tomas una foto con la cámara desde la app, también se guarda una copia en la Galería del teléfono (no cuando eliges una que ya existía ahí) — así, si tu teléfono ya respalda la galería (Google Fotos, etc.), la foto queda protegida por ese lado. Si desinstalas la app sin ese respaldo externo, las fotos se pierden igual que el resto de los datos.
- Recomendación: exporta ambos CSV periódicamente (ej. cada semana) mientras dure la construcción.

### Actualizar la app instalada (`.apk`)

Compilaciones nuevas (`npx eas-cli build --platform android --profile preview`) instaladas **sobre la app ya instalada** (sin desinstalarla) se tratan como una actualización y conservan la base de datos — Android identifica la app por su `android.package` en `app.json`, que no cambia entre compilaciones. Desinstalar primero borra los datos sin remedio (fuera de un CSV exportado antes).

## Requisitos

- Node.js 20+
- Un dispositivo o emulador Android, o la app [Expo Go](https://expo.dev/go)

## Cómo correr el proyecto

### En tu teléfono con Expo Go (recomendado, no requiere Android SDK)

1. Instala la app **Expo Go** desde Play Store en tu teléfono Android.
2. Conecta el teléfono a la misma red WiFi que tu computadora.
3. Corre:
   ```bash
   npm install
   npm start
   ```
4. Escanea el código QR que aparece en la terminal con Expo Go (botón "Scan QR code").

Si el teléfono y la PC no pueden verse en la misma red (ej. WiFi de invitados, VPN), usa `npx expo start --tunnel` en su lugar — es más lento pero no depende de estar en la misma red.

### En un emulador Android en tu PC

Requiere tener instalado Android Studio + Android SDK, con la variable de entorno `ANDROID_HOME` configurada y un emulador ya creado (AVD) o un dispositivo conectado por USB con `adb`. Con eso listo:

```bash
npm install
npm run android
```

Sin esa configuración, este comando falla buscando `adb`; usa la opción de Expo Go arriba en su lugar.

## Estructura

- `src/app/` — pantallas, ruteo por archivos con Expo Router
- `src/db/` — cliente, migraciones y seed de SQLite
- `src/repositories/` — capa de acceso a datos (projects, categories, budget_entries, expenses)
- `src/domain/` — tipos y cálculos (presupuesto, disponible, etc.)
- `src/store/` — estado de UI con Zustand (proyecto activo)
- `src/components/`, `src/hooks/`, `src/utils/` — piezas compartidas
- `scripts/` — herramientas de desarrollo (no son parte de la app), ej. el smoke test de la base de datos

## Scripts

- `npm start` — servidor de desarrollo de Expo
- `npm run android` — abre en emulador/dispositivo Android
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run typecheck` — TypeScript (app + scripts de desarrollo)
- `npm run db:smoke` — smoke test manual de la capa de datos (migraciones, seed, repositorios y cálculos) corriendo sobre SQLite en Node, sin necesitar un emulador
