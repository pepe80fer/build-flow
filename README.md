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
- `src/db/` — cliente y migraciones de SQLite (Fase 1)
- `src/repositories/` — capa de acceso a datos
- `src/domain/` — tipos y cálculos (presupuesto, disponible, etc.)
- `src/store/` — estado de UI con Zustand
- `src/components/`, `src/hooks/`, `src/utils/` — piezas compartidas

## Scripts

- `npm start` — servidor de desarrollo de Expo
- `npm run android` — abre en emulador/dispositivo Android
- `npm run lint` — ESLint
- `npm run format` — Prettier
