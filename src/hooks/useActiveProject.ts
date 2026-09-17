import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';

import { getActiveProject } from '@/repositories/projectsRepo';
import { useAppStore } from '@/store/useAppStore';

// Carga el proyecto único del MVP una sola vez y lo cachea en el store de
// Zustand para que todas las pantallas lo compartan sin volver a consultar
// SQLite. `loading` se deriva directamente de si ya hay proyecto en el
// store (el seed de la Fase 1 garantiza que siempre existe uno, así que no
// hace falta un estado de error/"no encontrado" separado). Si algo
// actualiza el proyecto (ej. la moneda al configurar el presupuesto
// inicial), debe llamar a `useAppStore.getState().setActiveProject(...)`
// con los datos nuevos para que el resto de la app se refresque.
export function useActiveProject() {
  const db = useSQLiteContext();
  const activeProject = useAppStore((state) => state.activeProject);
  const setActiveProject = useAppStore((state) => state.setActiveProject);

  useEffect(() => {
    if (activeProject) {
      return;
    }

    let isMounted = true;
    (async () => {
      const project = await getActiveProject(db);
      if (isMounted && project) {
        setActiveProject(project);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [db, activeProject, setActiveProject]);

  return { project: activeProject, loading: activeProject === null };
}
