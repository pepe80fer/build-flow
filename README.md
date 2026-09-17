# build-flow

App móvil personal (React Native + Expo, Android) para llevar el control de gastos de la construcción de una vivienda contra un presupuesto que puede aumentar con el tiempo.

El plan de desarrollo completo (decisiones, modelo de datos, fases y tareas) está en [`plan.md`](./plan.md).

## Requisitos

- Node.js 20+
- Un dispositivo o emulador Android, o la app [Expo Go](https://expo.dev/go)

## Cómo correr el proyecto

```bash
npm install
npm run android
```

Esto abre las opciones para correr la app en un emulador Android o en Expo Go en tu teléfono.

## Estructura

- `src/app/` — pantallas, ruteo por archivos con Expo Router
- `src/db/` — cliente, migraciones y seed de SQLite
- `src/repositories/` — capa de acceso a datos (projects, categories, budget_entries, expenses)
- `src/domain/` — tipos y cálculos (presupuesto, disponible, etc.)
- `src/store/` — estado de UI con Zustand (Fase 2+)
- `src/components/`, `src/hooks/`, `src/utils/` — piezas compartidas
- `scripts/` — herramientas de desarrollo (no son parte de la app), ej. el smoke test de la base de datos

## Scripts

- `npm start` — servidor de desarrollo de Expo
- `npm run android` — abre en emulador/dispositivo Android
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run typecheck` — TypeScript (app + scripts de desarrollo)
- `npm run db:smoke` — smoke test manual de la capa de datos (migraciones, seed, repositorios y cálculos) corriendo sobre SQLite en Node, sin necesitar un emulador
