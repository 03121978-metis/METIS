import { CATALOG } from "../kitchen/catalog";
import type { Opening, Wall } from "../kitchen/types";
import { wallLength } from "../kitchen/validation";

interface Segment {
  start: number;
  end: number;
}

const COUNTER_HEIGHT = 900; // mm — alto típico de bajo + encimera

/** Devuelve los tramos libres de un muro descontando puertas y ventanas
 *  que estén por debajo de la altura de encimera. */
export function freeSegmentsOnWall(wall: Wall, openings: Opening[]): Segment[] {
  const len = wallLength(wall);
  const blocked: Segment[] = [];
  for (const op of openings) {
    if (op.wallId !== wall.id) continue;
    if (op.kind === "door") {
      blocked.push({ start: op.offsetFromStart, end: op.offsetFromStart + op.width });
    } else if (op.kind === "window") {
      const sill = op.sillHeight ?? 900;
      if (sill < COUNTER_HEIGHT) {
        blocked.push({ start: op.offsetFromStart, end: op.offsetFromStart + op.width });
      }
    }
  }
  blocked.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const b of blocked) {
    if (b.start > cursor) segments.push({ start: cursor, end: Math.min(len, b.start) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < len) segments.push({ start: cursor, end: len });
  return segments.filter((s) => s.end - s.start >= 200);
}

/** Greedy fill: para cada segmento elige el bajo más ancho que entre,
 *  hasta que no quepa nada. Devuelve una lista de placements pendientes. */
export function autoFillWallPlan(
  wall: Wall,
  openings: Opening[],
): Array<{ sku: string; wallId: string; offsetFromStart: number; rotation: number }> {
  const placements: Array<{ sku: string; wallId: string; offsetFromStart: number; rotation: number }> = [];
  const bases = CATALOG.filter((c) => c.family === "base").sort((a, b) => b.width - a.width);
  for (const seg of freeSegmentsOnWall(wall, openings)) {
    let off = seg.start;
    while (off < seg.end) {
      const remaining = seg.end - off;
      const fit = bases.find((c) => c.width <= remaining);
      if (!fit) break;
      placements.push({ sku: fit.sku, wallId: wall.id, offsetFromStart: off, rotation: 0 });
      off += fit.width;
    }
  }
  return placements;
}
