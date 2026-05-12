import { getCatalogItem } from "./catalog";
import type {
  Metrics,
  ModulePlacement,
  Obstacle,
  Project,
  ValidationIssue,
  Vec2,
  Wall,
} from "./types";

// ─── Geometría básica ──────────────────────────────────────────────────────

export function wallLength(w: Wall): number {
  const dx = w.end.x - w.start.x;
  const dy = w.end.y - w.start.y;
  return Math.hypot(dx, dy);
}

export function wallDirection(w: Wall): Vec2 {
  const len = wallLength(w) || 1;
  return { x: (w.end.x - w.start.x) / len, y: (w.end.y - w.start.y) / len };
}

/** Proyecta un punto p sobre el segmento del muro y devuelve la distancia
 *  desde Wall.start (clamped a [0, length]). */
export function projectOnWall(p: Vec2, w: Wall): { offset: number; distance: number; foot: Vec2 } {
  const vx = w.end.x - w.start.x;
  const vy = w.end.y - w.start.y;
  const len2 = vx * vx + vy * vy;
  if (len2 === 0) return { offset: 0, distance: Math.hypot(p.x - w.start.x, p.y - w.start.y), foot: { ...w.start } };
  const t = ((p.x - w.start.x) * vx + (p.y - w.start.y) * vy) / len2;
  const tc = Math.max(0, Math.min(1, t));
  const foot = { x: w.start.x + vx * tc, y: w.start.y + vy * tc };
  const offset = tc * Math.sqrt(len2);
  const distance = Math.hypot(p.x - foot.x, p.y - foot.y);
  return { offset, distance, foot };
}

/** Devuelve el muro más cercano al punto y la distancia + offset proyectado. */
export function nearestWall(p: Vec2, walls: Wall[]): { wall: Wall; offset: number; distance: number; foot: Vec2 } | null {
  let best: { wall: Wall; offset: number; distance: number; foot: Vec2 } | null = null;
  for (const w of walls) {
    const r = projectOnWall(p, w);
    if (!best || r.distance < best.distance) best = { wall: w, ...r };
  }
  return best;
}

/** Normal hacia el INTERIOR de la habitación para un muro de un polígono
 *  recorrido en sentido horario (en coordenadas de planta con Y hacia abajo).
 *  Para dir=(1,0) → (0,1), para dir=(0,1) → (-1,0), etc. */
export function wallInteriorNormal(w: Wall): Vec2 {
  const dir = wallDirection(w);
  return { x: -dir.y, y: dir.x };
}

/** Rango utilizable de `offsetFromStart` sobre un muro para colocar un módulo
 *  de `width` mm, descontando el grosor de los muros perpendiculares en cada
 *  esquina. Asumimos polígono cerrado (cada extremo de muro coincide con un
 *  perpendicular). */
export function wallUsableRange(
  wall: Wall,
  walls: Wall[],
  width: number,
): { min: number; max: number } {
  const len = wallLength(wall);
  const eps = 0.5;
  // Buscar el muro que comparte el punto `wall.start` y el que comparte
  // `wall.end`. Si no hay (muro abierto), no descontamos esa esquina.
  const prev = walls.find(
    (w) => w.id !== wall.id && (
      Math.hypot(w.end.x - wall.start.x, w.end.y - wall.start.y) < eps ||
      Math.hypot(w.start.x - wall.start.x, w.start.y - wall.start.y) < eps
    ),
  );
  const next = walls.find(
    (w) => w.id !== wall.id && (
      Math.hypot(w.start.x - wall.end.x, w.start.y - wall.end.y) < eps ||
      Math.hypot(w.end.x - wall.end.x, w.end.y - wall.end.y) < eps
    ),
  );
  const insetStart = prev ? prev.thickness / 2 : 0;
  const insetEnd = next ? next.thickness / 2 : 0;
  const min = insetStart;
  const max = Math.max(min, len - insetEnd - width);
  return { min, max };
}

/** AABB de un módulo en planta (mm). Devuelve null si no se puede ubicar.
 *  Los módulos anclados a muro se sitúan contra la cara interior del muro
 *  (desplazados thickness/2 desde el eje del muro hacia el interior). */
export function moduleAabb(
  placement: ModulePlacement,
  walls: Wall[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const item = getCatalogItem(placement.sku);
  if (!item) return null;
  let anchor: Vec2;
  let dir: Vec2;
  let normal: Vec2;
  if (placement.wallId && placement.offsetFromStart !== undefined) {
    const wall = walls.find((w) => w.id === placement.wallId);
    if (!wall) return null;
    dir = wallDirection(wall);
    normal = wallInteriorNormal(wall);
    const innerOff = wall.thickness / 2;
    anchor = {
      x: wall.start.x + dir.x * placement.offsetFromStart + normal.x * innerOff,
      y: wall.start.y + dir.y * placement.offsetFromStart + normal.y * innerOff,
    };
  } else if (placement.position) {
    const rot = placement.rotation || 0;
    dir = { x: Math.cos(rot), y: Math.sin(rot) };
    normal = { x: -Math.sin(rot), y: Math.cos(rot) };
    anchor = placement.position;
  } else {
    return null;
  }
  const corners: Vec2[] = [
    anchor,
    { x: anchor.x + dir.x * item.width, y: anchor.y + dir.y * item.width },
    {
      x: anchor.x + dir.x * item.width + normal.x * item.depth,
      y: anchor.y + dir.y * item.width + normal.y * item.depth,
    },
    { x: anchor.x + normal.x * item.depth, y: anchor.y + normal.y * item.depth },
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function obstacleAabb(o: Obstacle): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: o.position.x,
    minY: o.position.y,
    maxX: o.position.x + o.width,
    maxY: o.position.y + o.depth,
  };
}

function aabbOverlap(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
}

export function polygonAreaMm2(points: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Reconstruye un polígono de habitación a partir de los muros conectando extremos. */
export function roomPolygon(walls: Wall[]): Vec2[] {
  if (walls.length === 0) return [];
  return walls.map((w) => w.start);
}

// ─── Métricas ──────────────────────────────────────────────────────────────

export function computeMetrics(project: Project): Metrics {
  let baseLinearMm = 0;
  let wallLinearMm = 0;
  let tallLinearMm = 0;
  let worktopLinearMm = 0;
  let baseCount = 0;
  let wallCount = 0;
  let tallCount = 0;
  let applianceCount = 0;
  let totalPrice = 0;

  for (const m of project.modules) {
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    totalPrice += item.price;
    switch (item.family) {
      case "base":
        baseLinearMm += item.width;
        baseCount += 1;
        worktopLinearMm += item.width;
        break;
      case "wall":
        wallLinearMm += item.width;
        wallCount += 1;
        break;
      case "tall":
        tallLinearMm += item.width;
        tallCount += 1;
        break;
      case "appliance":
        applianceCount += 1;
        break;
      case "sink":
        baseLinearMm += item.width;
        worktopLinearMm += item.width;
        break;
    }
  }

  const poly = roomPolygon(project.room.walls);
  const roomAreaM2 = polygonAreaMm2(poly) / 1_000_000;
  const roomPerimeterMm = project.room.walls.reduce((acc, w) => acc + wallLength(w), 0);

  // Lineal de muro ocupado por algún módulo alineado a muro
  const occupiedPerWall = new Map<string, number>();
  for (const m of project.modules) {
    if (!m.wallId) continue;
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    occupiedPerWall.set(m.wallId, (occupiedPerWall.get(m.wallId) ?? 0) + item.width);
  }
  const occupied = Array.from(occupiedPerWall.values()).reduce((a, b) => a + b, 0);
  const freeWallLinearMm = Math.max(0, roomPerimeterMm - occupied);

  return {
    totalPrice,
    baseLinearMm,
    wallLinearMm,
    tallLinearMm,
    worktopLinearMm,
    baseCount,
    wallCount,
    tallCount,
    applianceCount,
    roomAreaM2,
    roomPerimeterMm,
    freeWallLinearMm,
  };
}

// ─── Validación ────────────────────────────────────────────────────────────

interface WallSpan {
  start: number;
  end: number;
  id: string;
  label: string;
}

function spansOverlap(a: WallSpan, b: WallSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const wallById = new Map(project.room.walls.map((w) => [w.id, w]));

  // 1) Módulos fuera de su muro
  for (const m of project.modules) {
    if (!m.wallId) continue;
    const wall = wallById.get(m.wallId);
    const item = getCatalogItem(m.sku);
    if (!wall || !item) {
      if (!wall) issues.push({ severity: "error", code: "MODULE_WALL_MISSING", message: `Módulo ${m.sku} referencia un muro inexistente`, refs: [m.id] });
      if (!item) issues.push({ severity: "error", code: "MODULE_SKU_MISSING", message: `Módulo ${m.id} usa SKU desconocido ${m.sku}`, refs: [m.id] });
      continue;
    }
    const usable = wallUsableRange(wall, project.room.walls, item.width);
    const off = m.offsetFromStart ?? 0;
    if (off < usable.min - 0.5 || off > usable.max + 0.5) {
      issues.push({
        severity: "error",
        code: "MODULE_OUT_OF_WALL",
        message: `${item.name} (${item.width}mm) se monta sobre el muro perpendicular o sobresale (rango válido ${Math.round(usable.min)}–${Math.round(usable.max)}mm)`,
        refs: [m.id, wall.id],
      });
    }
  }

  // 2) Solapamientos entre módulos en el mismo muro, comprobando también el
  //    rango vertical (un alto sobre un bajo es legítimo aunque coincidan en
  //    planta porque viven a distintas alturas).
  interface VSpan extends WallSpan { yMin: number; yMax: number }
  const spansByWall = new Map<string, VSpan[]>();
  for (const m of project.modules) {
    if (!m.wallId) continue;
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    const off = m.offsetFromStart ?? 0;
    const yMin = item.mountHeight ?? 0;
    const yMax = yMin + item.height;
    if (!spansByWall.has(m.wallId)) spansByWall.set(m.wallId, []);
    spansByWall.get(m.wallId)!.push({
      id: m.id, label: item.name,
      start: off, end: off + item.width,
      yMin, yMax,
    });
  }
  // O(N²) por muro; un muro tiene como mucho ~20 módulos en una cocina
  // real, así que no merece la pena optimizar con el break que dependía
  // de la ordenación (no es seguro: si span[i+1] es muy ancho puede
  // hacer que span[i] no se solape con él pero sí con span[i+2]).
  for (const [, spans] of spansByWall) {
    for (let i = 0; i < spans.length; i++) {
      for (let j = i + 1; j < spans.length; j++) {
        if (!spansOverlap(spans[i], spans[j])) continue;
        const vOverlap = spans[i].yMin < spans[j].yMax && spans[j].yMin < spans[i].yMax;
        if (!vOverlap) continue;
        issues.push({
          severity: "error",
          code: "MODULE_OVERLAP",
          message: `Solapamiento entre "${spans[i].label}" y "${spans[j].label}"`,
          refs: [spans[i].id, spans[j].id],
        });
      }
    }
  }

  // 3) Módulos colisionando con huecos (puertas / ventanas)
  for (const m of project.modules) {
    if (!m.wallId) continue;
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    const off = m.offsetFromStart ?? 0;
    const mStart = off;
    const mEnd = off + item.width;
    for (const op of project.room.openings) {
      if (op.wallId !== m.wallId) continue;
      const oStart = op.offsetFromStart;
      const oEnd = op.offsetFromStart + op.width;
      const overlaps = mStart < oEnd && oStart < mEnd;
      if (!overlaps) continue;
      // Wall units pueden coexistir con ventanas si están por encima del dintel.
      if (op.kind === "window" && item.family === "wall") {
        const mountTop = (item.mountHeight ?? 0) + item.height;
        const lintel = (op.sillHeight ?? 0) + op.height;
        if ((item.mountHeight ?? 0) >= lintel) continue;
        if (mountTop <= (op.sillHeight ?? 0)) continue;
      }
      issues.push({
        severity: "error",
        code: "MODULE_HITS_OPENING",
        message: `"${item.name}" colisiona con un ${op.kind === "door" ? "hueco de puerta" : "hueco de ventana"}`,
        refs: [m.id, op.id],
      });
    }
  }

  // 4) Electrodomésticos sin sus utilities cercanas (advertencia, ±400mm)
  const utilityFootprint: Array<{ kind: string; wallId?: string; offset?: number; position?: Vec2 }> = project.utilities;
  for (const m of project.modules) {
    const item = getCatalogItem(m.sku);
    if (!item || !item.utilitiesRequired || item.utilitiesRequired.length === 0) continue;
    const off = m.offsetFromStart ?? 0;
    for (const need of item.utilitiesRequired) {
      const found = utilityFootprint.find((u) => {
        if (u.kind !== need) return false;
        if (m.wallId && u.wallId === m.wallId && u.offset !== undefined) {
          return u.offset >= off - 200 && u.offset <= off + item.width + 200;
        }
        return true; // si no podemos comparar geográficamente, consideramos cubierto
      });
      if (!found) {
        issues.push({
          severity: "warning",
          code: "UTILITY_MISSING",
          message: `"${item.name}" requiere ${need} y no se ha colocado cerca`,
          refs: [m.id],
        });
      }
    }
  }

  // 5) Módulos colisionando con obstáculos (columnas, pilastras…)
  const obstacles = project.room.obstacles ?? [];
  for (const m of project.modules) {
    const mAabb = moduleAabb(m, project.room.walls);
    if (!mAabb) continue;
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    for (const o of obstacles) {
      if (aabbOverlap(mAabb, obstacleAabb(o))) {
        const obsLabel = o.label ?? (o.kind === "column" ? "columna" : o.kind);
        issues.push({
          severity: "error",
          code: "MODULE_HITS_OBSTACLE",
          message: `"${item.name}" colisiona con ${obsLabel}`,
          refs: [m.id, o.id],
        });
      }
    }
  }

  // 6) Frigorífico/horno junto a fregadero (info)
  for (const m of project.modules) {
    const item = getCatalogItem(m.sku);
    if (!item) continue;
    if (!(item.sku.includes("FRI") || item.sku.includes("HOR"))) continue;
    const off = m.offsetFromStart ?? 0;
    for (const n of project.modules) {
      if (n.id === m.id) continue;
      const nItem = getCatalogItem(n.sku);
      if (!nItem || nItem.family !== "sink") continue;
      if (n.wallId !== m.wallId) continue;
      const noff = n.offsetFromStart ?? 0;
      const gap = Math.abs((off + item.width / 2) - (noff + nItem.width / 2));
      if (gap < 600) {
        issues.push({
          severity: "info",
          code: "ZONE_ADJACENT",
          message: `"${item.name}" demasiado cerca del fregadero — se recomienda ≥600mm`,
          refs: [m.id, n.id],
        });
      }
    }
  }

  return issues;
}
