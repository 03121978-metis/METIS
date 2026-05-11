import { create } from "zustand";
import type {
  ModulePlacement,
  Opening,
  Project,
  Utility,
  Wall,
} from "./kitchen/types";

const ROOM_SIZE = 3000; // mm
const CEILING = 2400;   // mm
const WALL_THICKNESS = 100;

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function emptyProject(): Project {
  const now = new Date().toISOString();
  // Rectángulo 3000×3000 con esquinas en (0,0)-(3000,0)-(3000,3000)-(0,3000).
  // Las paredes se definen en orden horario para que polygonAreaMm2 dé el área esperada.
  const corners = [
    { x: 0, y: 0 },
    { x: ROOM_SIZE, y: 0 },
    { x: ROOM_SIZE, y: ROOM_SIZE },
    { x: 0, y: ROOM_SIZE },
  ];
  const walls: Wall[] = corners.map((c, i) => ({
    id: `wall_${i + 1}`,
    start: c,
    end: corners[(i + 1) % corners.length],
    thickness: WALL_THICKNESS,
  }));

  return {
    id: makeId("prj"),
    name: "Cocina sin nombre",
    room: { walls, openings: [], ceilingHeight: CEILING },
    modules: [],
    utilities: [],
    createdAt: now,
    updatedAt: now,
  };
}

export interface ProjectActions {
  addModule: (mod: Omit<ModulePlacement, "id"> & { id?: string }) => string;
  removeModule: (id: string) => void;
  updateModule: (id: string, patch: Partial<ModulePlacement>) => void;
  addWall: (wall: Omit<Wall, "id"> & { id?: string }) => string;
  addOpening: (opening: Omit<Opening, "id"> & { id?: string }) => string;
  addUtility: (utility: Omit<Utility, "id"> & { id?: string }) => string;
  resetProject: () => void;
  renameProject: (name: string) => void;
}

export interface StoreState {
  project: Project;
  selectedModuleId: string | null;
  setSelectedModule: (id: string | null) => void;
  actions: ProjectActions;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: new Date().toISOString() };
}

export const useStore = create<StoreState>((set) => ({
  project: emptyProject(),
  selectedModuleId: null,
  setSelectedModule: (id) => set({ selectedModuleId: id }),
  actions: {
    addModule: (mod) => {
      const id = mod.id ?? makeId("mod");
      set((s) => ({
        project: touch({ ...s.project, modules: [...s.project.modules, { ...mod, id }] }),
      }));
      return id;
    },
    removeModule: (id) =>
      set((s) => ({
        project: touch({ ...s.project, modules: s.project.modules.filter((m) => m.id !== id) }),
        selectedModuleId: s.selectedModuleId === id ? null : s.selectedModuleId,
      })),
    updateModule: (id, patch) =>
      set((s) => ({
        project: touch({
          ...s.project,
          modules: s.project.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }),
      })),
    addWall: (wall) => {
      const id = wall.id ?? makeId("wall");
      set((s) => ({
        project: touch({
          ...s.project,
          room: { ...s.project.room, walls: [...s.project.room.walls, { ...wall, id }] },
        }),
      }));
      return id;
    },
    addOpening: (opening) => {
      const id = opening.id ?? makeId("op");
      set((s) => ({
        project: touch({
          ...s.project,
          room: { ...s.project.room, openings: [...s.project.room.openings, { ...opening, id }] },
        }),
      }));
      return id;
    },
    addUtility: (utility) => {
      const id = utility.id ?? makeId("util");
      set((s) => ({
        project: touch({ ...s.project, utilities: [...s.project.utilities, { ...utility, id }] }),
      }));
      return id;
    },
    resetProject: () => set({ project: emptyProject(), selectedModuleId: null }),
    renameProject: (name) => set((s) => ({ project: touch({ ...s.project, name }) })),
  },
}));

// Helper que evita re-renderizar componentes que sólo necesitan acciones.
export const useActions = (): ProjectActions => useStore((s) => s.actions);
export const useProject = (): Project => useStore((s) => s.project);
