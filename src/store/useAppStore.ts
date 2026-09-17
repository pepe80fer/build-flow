import { create } from 'zustand';

import type { Project } from '@/domain/types';

interface AppState {
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
}

// Estado de UI global y ligero (fuera de los datos de SQLite). Por ahora
// solo cachea el proyecto activo del MVP para no releerlo en cada pantalla.
// En la Entrega 3 (multi-proyecto) este store crecería para manejar la
// selección explícita de proyecto en vez de un único "activo implícito".
export const useAppStore = create<AppState>((set) => ({
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
}));
