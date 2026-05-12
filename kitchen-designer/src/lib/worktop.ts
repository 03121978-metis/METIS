import type { Project, Wall } from "../kitchen/types";
import { getCatalogItem } from "../kitchen/catalog";
import { wallLength, wallUsableRange } from "../kitchen/validation";

export interface WorktopSegment {
  wallId: string;
  start: number; // mm a lo largo del muro (Wall.start → Wall.end)
  end: number;
}

/** Familias de módulos que llevan encimera encima. */
function bearsWorktop(sku: string): boolean {
  const item = getCatalogItem(sku);
  if (!item) return false;
  return item.family === "base" || item.family === "sink" ||
    (item.family === "appliance" && (item.sku === "A-LAV-60" || item.sku === "A-IND-60" || item.sku === "A-GAS-60"));
}

const MERGE_GAP_MM = 50; // huecos menores se unen en un solo tramo

export function computeWorktopSegments(project: Project): WorktopSegment[] {
  if (!project.worktop || project.worktop.mode === "none") return [];
  const segs: WorktopSegment[] = [];

  for (const wall of project.room.walls) {
    if (project.worktop.mode === "full-wall") {
      const r = wallUsableRange(wall, project.room.walls, 0);
      if (r.max > r.min) segs.push({ wallId: wall.id, start: r.min, end: r.max + 0 });
      continue;
    }

    // Mode = over-modules: mergea bases adyacentes (gap < MERGE_GAP_MM).
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
      // Recortamos al muro por si un módulo está mal puesto.
      segs.push({
        wallId: wall.id,
        start: Math.max(0, m.start),
        end: Math.min(wlen, m.end),
      });
    }
  }
  return segs;
}

/** Cálculo del lineal total de encimera, útil para métricas/PDF. */
export function worktopLinearMm(project: Project): number {
  return computeWorktopSegments(project).reduce((s, x) => s + (x.end - x.start), 0);
}

export function findWallById(walls: Wall[], id: string): Wall | undefined {
  return walls.find((w) => w.id === id);
}
