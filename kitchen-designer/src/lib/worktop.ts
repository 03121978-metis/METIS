import type { Project, Vec2, Wall } from "../kitchen/types";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallInteriorNormal, wallLength } from "../kitchen/validation";

/** Una banda recta sobre un muro: tramo de `start` a `end` a lo largo del muro. */
export interface WallBandShape {
  kind: "wall-band";
  wallId: string;
  start: number;
  end: number;
}

/** Cuadrado de rincón en una esquina del polígono: depth × depth de la
 *  encimera, anclado a una esquina compartida por dos muros. Para detalle de
 *  rincón con mueble B-90-RIN y W-60-RIN. */
export interface CornerFillShape {
  kind: "corner-fill";
  wallId: string;        // muro "principal" en el que está el módulo de rincón
  cornerOffset: number;  // offset a lo largo del muro principal donde está la esquina
  size: number;          // lado del cuadrado
  // Anchor en world coords: la esquina del rincón.
  anchor: Vec2;
  // Vectores unitarios para el rect: dir a lo largo del muro principal y
  // normal hacia el interior.
  dirIntoWall: Vec2;     // dirección que va contra el muro (-dir si esquina al inicio)
  normalIntoRoom: Vec2;
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

/** Módulos que llevan encimera encima. */
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

export function computeWorktopShapes(project: Project): WorktopShape[] {
  if (!project.worktop || project.worktop.mode === "none") return [];
  const out: WorktopShape[] = [];
  const mode = project.worktop.mode;

  // 1) Bandas por muro
  for (const wall of project.room.walls) {
    if (mode === "full-wall") {
      const len = wallLength(wall);
      if (len > 0) out.push({ kind: "wall-band", wallId: wall.id, start: 0, end: len });
      continue;
    }
    // over-modules
    const intervals = project.modules
      .filter((m) => m.wallId === wall.id && m.offsetFromStart !== undefined && bearsWorktop(m.sku))
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

  // 2) Rellenos de esquina (solo en modo over-modules; en full-wall las
  //    bandas ya cubren toda la pared y se solapan en el rincón).
  if (mode === "over-modules") {
    for (const m of project.modules) {
      if (!m.wallId || m.offsetFromStart === undefined) continue;
      if (!isCornerSku(m.sku)) continue;
      const item = getCatalogItem(m.sku);
      if (!item || item.family !== "base") continue;
      const wall = project.room.walls.find((w) => w.id === m.wallId);
      if (!wall) continue;
      const dir = wallDirection(wall);
      const normal = wallInteriorNormal(wall);
      const wlen = wallLength(wall);
      // Detectar qué extremo del muro ocupa el rincón.
      const atStart = m.offsetFromStart < 10;
      const atEnd = m.offsetFromStart + item.width > wlen - 10;
      if (!atStart && !atEnd) continue;
      const cornerOffset = atStart ? 0 : wlen;
      const cornerPt: Vec2 = atStart
        ? { x: wall.start.x, y: wall.start.y }
        : { x: wall.end.x, y: wall.end.y };
      out.push({
        kind: "corner-fill",
        wallId: wall.id,
        cornerOffset,
        size: item.depth,
        anchor: cornerPt,
        dirIntoWall: atStart ? dir : { x: -dir.x, y: -dir.y },
        normalIntoRoom: normal,
      });
    }
  }

  // 3) Islas (módulos free-standing con bajos sobre ellos).
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

/** Lineal total (sólo wall-band, para métricas). */
export function worktopLinearMm(project: Project): number {
  return computeWorktopShapes(project)
    .filter((s): s is WallBandShape => s.kind === "wall-band")
    .reduce((acc, s) => acc + (s.end - s.start), 0);
}

export function findWallById(walls: Wall[], id: string): Wall | undefined {
  return walls.find((w) => w.id === id);
}
