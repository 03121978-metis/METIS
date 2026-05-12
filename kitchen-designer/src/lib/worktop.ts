import type { Project, Vec2, Wall } from "../kitchen/types";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallInteriorNormal, wallLength, wallUsableRange } from "../kitchen/validation";

/** Banda recta sobre un muro: tramo de `start` a `end` a lo largo del muro. */
export interface WallBandShape {
  kind: "wall-band";
  wallId: string;
  start: number;
  end: number;
}

/** Cuadrado de rincón axis-aligned en el plano. Lo definimos por su centro
 *  porque así el render es trivial (Rect/Box centrado) sin lidiar con
 *  rotaciones ambiguas que un único Y-rotation no puede resolver. */
export interface CornerFillShape {
  kind: "corner-fill";
  center: Vec2;
  size: number;
}

/** Encimera sobre una isla (módulo libre sin wallId). */
export interface IslandShape {
  kind: "island";
  centerX: number;
  centerY: number;
  width: number;
  depth: number;
  rotationRad: number;
}

export type WorktopShape = WallBandShape | CornerFillShape | IslandShape;

function bearsWorktop(sku: string): boolean {
  const item = getCatalogItem(sku);
  if (!item) return false;
  return item.family === "base" || item.family === "sink" ||
    (item.family === "appliance" && (item.sku === "A-LAV-60" || item.sku === "A-IND-60" || item.sku === "A-GAS-60"));
}

function isCornerSku(sku: string): boolean {
  return /-RIN(-|$)/.test(sku);
}

const MERGE_GAP_MM = 50;
const CORNER_EPS = 1; // mm; el snap deja exactamente en range.min/max

export function computeWorktopShapes(project: Project): WorktopShape[] {
  if (!project.worktop || project.worktop.mode === "none") return [];
  const out: WorktopShape[] = [];
  const mode = project.worktop.mode;

  // 1) Bandas por muro (excluye módulos rincón — esos generan corner-fill)
  for (const wall of project.room.walls) {
    if (mode === "full-wall") {
      const len = wallLength(wall);
      if (len > 0) out.push({ kind: "wall-band", wallId: wall.id, start: 0, end: len });
      continue;
    }
    const intervals = project.modules
      .filter((m) => m.wallId === wall.id && m.offsetFromStart !== undefined && bearsWorktop(m.sku))
      .filter((m) => !isCornerSku(m.sku))
      .map((m) => {
        const it = getCatalogItem(m.sku)!;
        return { start: m.offsetFromStart!, end: m.offsetFromStart! + it.width };
      })
      .sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [];
    for (const iv of intervals) {
      const last = merged[merged.length - 1];
      if (last && iv.start - last.end < MERGE_GAP_MM) {
        last.end = Math.max(last.end, iv.end);
      } else {
        merged.push({ ...iv });
      }
    }
    const wlen = wallLength(wall);
    for (const m of merged) {
      out.push({
        kind: "wall-band",
        wallId: wall.id,
        start: Math.max(0, m.start),
        end: Math.min(wlen, m.end),
      });
    }
  }

  // 2) Rellenos de esquina (solo over-modules). Detectamos por proximidad
  //    al range.min/max del muro porque el snap pone el módulo ahí
  //    exactamente.
  if (mode === "over-modules") {
    for (const m of project.modules) {
      if (!m.wallId || m.offsetFromStart === undefined) continue;
      if (!isCornerSku(m.sku)) continue;
      const item = getCatalogItem(m.sku);
      if (!item || item.family !== "base") continue;
      const wall = project.room.walls.find((w) => w.id === m.wallId);
      if (!wall) continue;

      const range = wallUsableRange(wall, project.room.walls, item.width);
      const atStart = Math.abs(m.offsetFromStart - range.min) < CORNER_EPS;
      const atEnd = Math.abs(m.offsetFromStart - range.max) < CORNER_EPS;
      if (!atStart && !atEnd) continue;

      const dir = wallDirection(wall);
      const normal = wallInteriorNormal(wall);
      const cornerPt: Vec2 = atStart
        ? { x: wall.start.x, y: wall.start.y }
        : { x: wall.end.x, y: wall.end.y };
      // Vector que va desde la esquina hacia el cuerpo del módulo.
      const dirInto = atStart ? dir : { x: -dir.x, y: -dir.y };
      // Centro del cuadrado: 1) desplazamos thickness/2 desde la esquina
      //   en ambas direcciones (dirInto + normal) para llegar a la
      //   esquina interior; 2) avanzamos size/2 más en cada dirección
      //   para llegar al centro.
      const off = wall.thickness / 2 + item.depth / 2;
      const center: Vec2 = {
        x: cornerPt.x + dirInto.x * off + normal.x * off,
        y: cornerPt.y + dirInto.y * off + normal.y * off,
      };
      out.push({ kind: "corner-fill", center, size: item.depth });
    }
  }

  // 3) Islas
  for (const m of project.modules) {
    if (m.wallId) continue;
    if (!m.position) continue;
    if (!bearsWorktop(m.sku)) continue;
    const item = getCatalogItem(m.sku)!;
    out.push({
      kind: "island",
      centerX: m.position.x + item.width / 2,
      centerY: m.position.y + item.depth / 2,
      width: item.width,
      depth: item.depth,
      rotationRad: m.rotation || 0,
    });
  }

  return out;
}

export function worktopLinearMm(project: Project): number {
  return computeWorktopShapes(project)
    .filter((s): s is WallBandShape => s.kind === "wall-band")
    .reduce((acc, s) => acc + (s.end - s.start), 0);
}

export function findWallById(walls: Wall[], id: string): Wall | undefined {
  return walls.find((w) => w.id === id);
}
