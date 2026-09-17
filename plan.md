# build-flow — Plan de desarrollo

App móvil personal para llevar el control de gastos de la construcción de una vivienda, contra un presupuesto inicial que puede aumentar con el tiempo.

Estado: **Plan aprobado, pendiente de inicio de desarrollo.**

## 1. Decisiones confirmadas

| Aspecto             | Decisión                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Stack               | React Native + Expo (nativo)                                                              |
| Plataforma objetivo | Solo Android (reciente)                                                                   |
| Almacenamiento      | SQLite local (`expo-sqlite`), acceso directo con SQL (sin ORM)                            |
| Estado UI           | Zustand                                                                                   |
| Moneda              | Única por proyecto, configurable (sin conversión entre monedas)                           |
| Fotos/recibos       | No en el MVP — planeado para la Entrega 2                                                 |
| Backup / respaldo   | Exportar a CSV + compartir archivo (share sheet de Android) — esencial desde el MVP       |
| PIN / biometría     | No en el MVP — backlog para una entrega futura                                            |
| Modelo de datos     | Incluye entidad `Project` desde ya (oculta en la UI del MVP, se crea una automáticamente) |
| Uso                 | Personal, un solo usuario, sin backend ni multiusuario                                    |

Evolución futura contemplada (no se construye ahora, pero el diseño no la bloquea):

- App comercial.
- Generalización a múltiples "proyectos" de cualquier tipo (no solo construcción de vivienda).
- Backend/sincronización si se vuelve comercial.

## 2. Librerías

- **Navegación:** Expo Router (basado en React Navigation, ruteo por archivos). Estándar actual de Expo; simplifica la estructura para una app de este tamaño.
- **Estado UI:** Zustand — para estado ligero fuera de los datos de SQLite (ej. proyecto activo, filtros).
- **Acceso a datos:** `expo-sqlite` directo + capa propia de repositorios (funciones tipo `getExpenses()`, `addExpense()`, etc.). Sin ORM para no sobre-diseñar el MVP.
- **Selector de fecha:** `@react-native-community/datetimepicker`.
- **Exportación:** `expo-file-system` (generar CSV) + `expo-sharing` (compartir vía share sheet de Android).
- **Gráficos (Entrega 2):** por decidir al llegar a esa fase; candidato: `react-native-gifted-charts`.

## 3. Modelo de datos

Pensado para el MVP pero extensible a las Entregas 2 y 3 sin rehacer el esquema. Migraciones simples vía `PRAGMA user_version` (permiten agregar columnas/tablas después, ej. `photo_uri` en `expenses` para la Entrega 2, sin romper nada).

Todos los montos se almacenan como **enteros en centavos** para evitar errores de punto flotante.

### `projects`

Oculta en la UI del MVP; se crea una automáticamente al primer arranque.

| Campo                       | Tipo                          | Notas                                                    |
| --------------------------- | ----------------------------- | -------------------------------------------------------- |
| `id`                        | PK                            |                                                          |
| `name`                      | string                        | ej. "Mi Casa"                                            |
| `type`                      | `'construction' \| 'generic'` | hoy solo `'construction'`; abre la puerta a la Entrega 3 |
| `currency`                  | string (ISO)                  | ej. `COP`, elegible al primer arranque                   |
| `created_at` / `updated_at` | timestamp                     |                                                          |
| `is_archived`               | bool                          | reservado para futuro multi-proyecto                     |

### `categories`

Seedeadas automáticamente al crear el proyecto, según su `type`.

| Campo        | Tipo   | Notas                                                                                                                                          |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | PK     |                                                                                                                                                |
| `project_id` | FK     |                                                                                                                                                |
| `name`       | string | Materiales, Mano de obra, Maquinaria/herramientas, Transporte, Permisos y trámites, Servicios profesionales, Mantenimiento, Imprevistos, Otros |
| `is_default` | bool   | sistema vs. agregada por el usuario                                                                                                            |
| `sort_order` | int    | orden de despliegue                                                                                                                            |

### `budget_entries`

El presupuesto inicial y cada incremento son una fila cada uno. El total es la suma de todas las filas del proyecto → historial completo, no solo un número.

| Campo                       | Tipo                      | Notas |
| --------------------------- | ------------------------- | ----- |
| `id`                        | PK                        |       |
| `project_id`                | FK                        |       |
| `date`                      | date                      |       |
| `amount`                    | int (centavos)            |       |
| `type`                      | `'initial' \| 'increase'` |       |
| `note`                      | string, opcional          |       |
| `created_at` / `updated_at` | timestamp                 |       |

### `expenses`

| Campo                       | Tipo             | Notas                                               |
| --------------------------- | ---------------- | --------------------------------------------------- |
| `id`                        | PK               |                                                     |
| `project_id`                | FK               |                                                     |
| `category_id`               | FK               |                                                     |
| `date`                      | date             |                                                     |
| `amount`                    | int (centavos)   |                                                     |
| `note`                      | string, opcional | también sirve de detalle cuando categoría = "Otros" |
| `created_at` / `updated_at` | timestamp        |                                                     |

### Cálculo de disponible

No se guarda en tabla, se calcula en tiempo real:

```
disponible = SUM(budget_entries.amount) − SUM(expenses.amount)   [filtrado por project_id]
```

## 4. Estructura de carpetas (Expo Router)

```
build-flow/
├── app/                        # pantallas (file-based routing)
│   ├── _layout.tsx
│   ├── index.tsx                # Home: resumen presupuesto
│   ├── expenses/
│   │   ├── index.tsx            # Lista de gastos
│   │   ├── new.tsx
│   │   └── [id].tsx             # Editar/eliminar
│   └── budget/
│       ├── index.tsx            # Historial de incrementos
│       └── increase.tsx
├── src/
│   ├── db/                      # client, migrations, seed
│   ├── repositories/            # projectsRepo, categoriesRepo, budgetEntriesRepo, expensesRepo
│   ├── domain/                  # types.ts, calculations.ts
│   ├── store/                   # useAppStore.ts (Zustand)
│   ├── components/              # ExpenseForm, BudgetSummaryCard, CategoryPicker, DateField...
│   ├── hooks/                   # useExpenses, useBudget, useCategories
│   └── utils/                   # money.ts, date.ts, export.ts
├── assets/
├── plan.md                      # este documento
├── app.json / package.json / tsconfig.json
```

## 5. Plan de tareas del MVP (por fases)

### Fase 0 — Setup

- [x] 0.1 Crear proyecto Expo (TypeScript) y limpiar boilerplate
- [x] 0.2 Configurar Expo Router y estructura de carpetas base
- [x] 0.3 Instalar dependencias (expo-sqlite, datetimepicker, zustand, expo-file-system, expo-sharing)
- [x] 0.4 Configurar tsconfig estricto y lint/format básico
- [x] 0.5 Push inicial al repo

### Fase 1 — Capa de datos

- [x] 1.1 Definir esquema SQL inicial (`projects`, `categories`, `budget_entries`, `expenses`)
- [x] 1.2 Runner de migraciones simple (`PRAGMA user_version`)
- [x] 1.3 Seed inicial: proyecto default + categorías predefinidas de construcción
- [x] 1.4 Repositorios CRUD (projectsRepo, categoriesRepo, budgetEntriesRepo, expensesRepo)
- [x] 1.5 Funciones de cálculo (`totalBudget`, `totalSpent`, `available`)
- [x] 1.6 Smoke test manual de la capa de datos

### Fase 2 — Presupuesto

- [ ] 2.1 Pantalla "Configurar presupuesto inicial" (monto, moneda, fecha) — primer arranque
- [ ] 2.2 Pantalla resumen: presupuesto total, gastado, disponible (tiempo real)
- [ ] 2.3 Pantalla "Historial de incrementos"
- [ ] 2.4 Formulario "Registrar incremento" (fecha, monto, nota opcional)
- [ ] 2.5 Editar/eliminar un incremento (incluye poder editar el "inicial")

### Fase 3 — Gastos

- [ ] 3.1 Formulario "Nuevo gasto" (fecha con selector, monto, categoría predefinida + otros, nota opcional)
- [ ] 3.2 Lista de gastos (orden por fecha desc)
- [ ] 3.3 Editar gasto existente
- [ ] 3.4 Eliminar gasto (con confirmación)
- [ ] 3.5 Recalculo en tiempo real del disponible tras crear/editar/eliminar

### Fase 4 — Exportación / Backup

- [ ] 4.1 Generar CSV de gastos (fecha, monto, categoría, nota)
- [ ] 4.2 Generar CSV de historial de presupuesto
- [ ] 4.3 Compartir archivo vía share sheet de Android

### Fase 5 — Pulido UI/UX

- [ ] 5.1 Estados vacíos (sin gastos, sin incrementos)
- [ ] 5.2 Validaciones de formularios (montos positivos, fecha y categoría requeridas)
- [ ] 5.3 Formato de moneda/números consistente
- [ ] 5.4 Ajustes visuales mobile-first (tamaños táctiles, spacing, tipografía)
- [ ] 5.5 Manejo básico de errores

### Fase 6 — Entrega

- [ ] 6.1 README con instrucciones de instalación/uso
- [ ] 6.2 Commit y push final del MVP
- [ ] 6.3 Validación en dispositivo Android real

## 6. Entregas futuras (fuera de alcance del MVP)

**Entrega 2:**

- Reportes semanales/mensuales de gastos
- Gráficos (por categoría, por período, curva de gasto vs presupuesto)
- Filtros y búsqueda de gastos
- Fotos/recibos adjuntos a cada gasto
- Backlog: PIN/biometría para abrir la app

**Entrega 3 (a futuro, no ahora):**

- Generalizar el modelo para soportar múltiples "proyectos" de cualquier tipo (la construcción de vivienda sería un caso particular, vía el campo `type`)
- Evaluar necesidad de backend/sincronización si se vuelve comercial
