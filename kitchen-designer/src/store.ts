import { create } from "zustand";
import type {
  ModulePlacement,
  Obstacle,
  Opening,
  Project,
  Utility,
  Wall,
} from "./kitchen/types";

const ROOM_SIZE = 3000; // mm
const CEILING = 2400;   // mm
const WALL_THICKNESS = 100;
const HISTORY_LIMIT = 60;

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function emptyProject(): Project {
  const now = new Date().toISOString();
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
    room: { walls, openings: [], obstacles: [], ceilingHeight: CEILING },
    modules: [],
    utilities: [],
    createdAt: now,
    updatedAt: now,
  };
}

export type Selection =
  | { kind: "module"; id: string }
  | { kind: "obstacle"; id: string }
  | { kind: "opening"; id: string }
  | null;

export interface ProjectActions {
  addModule: (mod: Omit<ModulePlacement, "id"> & { id?: string }) => string;
  removeModule: (id: string) => void;
  updateModule: (id: string, patch: Partial<ModulePlacement>) => void;
  addWall: (wall: Omit<Wall, "id"> & { id?: string }) => string;
  addOpening: (opening: Omit<Opening, "id"> & { id?: string }) => string;
  removeOpening: (id: string) => void;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  addUtility: (utility: Omit<Utility, "id"> & { id?: string }) => string;
  addObstacle: (obstacle: Omit<Obstacle, "id"> & { id?: string }) => string;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, patch: Partial<Obstacle>) => void;
  setRoomDimensions: (widthMm: number, depthMm: number, ceilingMm: number) => void;
  resetProject: () => void;
  renameProject: (name: string) => void;
  undo: () => void;
}

export interface StoreState {
  project: Project;
  history: Project[];
  selection: Selection;
  setSelection: (sel: Selection) => void;
  /** SKU del catálogo seleccionado para colocar al hacer click en la planta. */
  placingSku: string | null;
  setPlacingSku: (sku: string | null) => void;
  actions: ProjectActions;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: new Date().toISOString() };
}

/** Devuelve el patch parcial que añade el estado actual al historial. */
function snapshot(s: StoreState): Pick<StoreState, "history"> {
  const next = [...s.history, s.project];
  if (next.length > HISTORY_LIMIT) next.splice(0, next.length - HISTORY_LIMIT);
  return { history: next };
}

export const useStore = create<StoreState>((set) => ({
  project: emptyProject(),
  history: [],
  selection: null,
  setSelection: (sel) => set({ selection: sel }),
  placingSku: null,
  setPlacingSku: (sku) => set({ placingSku: sku }),
  actions: {
    addModule: (mod) => {
      const id = mod.id ?? makeId("mod");
      set((s) => ({
        ...snapshot(s),
        project: touch({ ...s.project, modules: [...s.project.modules, { ...mod, id }] }),
      }));
      return id;
    },
    removeModule: (id) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({ ...s.project, modules: s.project.modules.filter((m) => m.id !== id) }),
        selection: s.selection?.kind === "module" && s.selection.id === id ? null : s.selection,
      })),
    updateModule: (id, patch) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          modules: s.project.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }),
      })),
    addWall: (wall) => {
      const id = wall.id ?? makeId("wall");
      set((s) => ({
        ...snapshot(s),
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
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: { ...s.project.room, openings: [...s.project.room.openings, { ...opening, id }] },
        }),
      }));
      return id;
    },
    removeOpening: (id) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: { ...s.project.room, openings: s.project.room.openings.filter((o) => o.id !== id) },
        }),
        selection: s.selection?.kind === "opening" && s.selection.id === id ? null : s.selection,
      })),
    updateOpening: (id, patch) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: {
            ...s.project.room,
            openings: s.project.room.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)),
          },
        }),
      })),
    addUtility: (utility) => {
      const id = utility.id ?? makeId("util");
      set((s) => ({
        ...snapshot(s),
        project: touch({ ...s.project, utilities: [...s.project.utilities, { ...utility, id }] }),
      }));
      return id;
    },
    addObstacle: (obstacle) => {
      const id = obstacle.id ?? makeId("obs");
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: {
            ...s.project.room,
            obstacles: [...(s.project.room.obstacles ?? []), { ...obstacle, id }],
          },
        }),
      }));
      return id;
    },
    removeObstacle: (id) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: {
            ...s.project.room,
            obstacles: (s.project.room.obstacles ?? []).filter((o) => o.id !== id),
          },
        }),
        selection: s.selection?.kind === "obstacle" && s.selection.id === id ? null : s.selection,
      })),
    updateObstacle: (id, patch) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({
          ...s.project,
          room: {
            ...s.project.room,
            obstacles: (s.project.room.obstacles ?? []).map((o) =>
              o.id === id ? { ...o, ...patch } : o,
            ),
          },
        }),
      })),
    setRoomDimensions: (widthMm, depthMm, ceilingMm) =>
      set((s) => {
        const w = Math.max(500, Math.round(widthMm));
        const d = Math.max(500, Math.round(depthMm));
        const c = Math.max(2000, Math.round(ceilingMm));
        const corners = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: d },
          { x: 0, y: d },
        ];
        const oldWalls = s.project.room.walls;
        const walls: Wall[] = corners.map((c, i) => ({
          id: oldWalls[i]?.id ?? `wall_${i + 1}`,
          start: c,
          end: corners[(i + 1) % corners.length],
          thickness: oldWalls[i]?.thickness ?? WALL_THICKNESS,
        }));
        return {
          ...snapshot(s),
          project: touch({
            ...s.project,
            room: { ...s.project.room, walls, ceilingHeight: c },
          }),
        };
      }),
    resetProject: () =>
      set((s) => ({
        ...snapshot(s),
        project: emptyProject(),
        selection: null,
      })),
    renameProject: (name) =>
      set((s) => ({
        ...snapshot(s),
        project: touch({ ...s.project, name }),
      })),
    undo: () =>
      set((s) => {
        if (s.history.length === 0) return {};
        const prev = s.history[s.history.length - 1];
        return {
          history: s.history.slice(0, -1),
          project: prev,
          selection: null,
        };
      }),
  },
}));

// Helper que evita re-renderizar componentes que sólo necesitan acciones.
export const useActions = (): ProjectActions => useStore((s) => s.actions);
export const useProject = (): Project => useStore((s) => s.project);
export const useCanUndo = (): boolean => useStore((s) => s.history.length > 0);
