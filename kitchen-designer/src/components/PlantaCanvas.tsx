import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Group, Text, Circle, Arc } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useProject, useActions, useStore } from "../store";
import type { Selection } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { nearestWall, wallDirection, wallInteriorNormal, wallUsableRange } from "../kitchen/validation";
import type { ModulePlacement, Obstacle, Vec2, Wall } from "../kitchen/types";
import { setStage } from "../lib/stageRef";
import { computeWorktopShapes } from "../lib/worktop";

interface ViewTransform {
  scale: number; // px por mm
  offsetX: number;
  offsetY: number;
}

// Modo de colocación click-to-place: se elige un SKU en el catálogo (store
// .placingSku) y luego se hace click en la planta. El módulo se ancla al
// muro más cercano al cursor; Shift+click para colocar como isla libre.

function computeFit(width: number, height: number, walls: Wall[]): ViewTransform {
  if (walls.length === 0 || width === 0 || height === 0) {
    return { scale: 0.1, offsetX: 0, offsetY: 0 };
  }
  const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const pad = 80;
  const scale = Math.min((width - pad * 2) / w, (height - pad * 2) / h);
  const offsetX = pad - minX * scale + ((width - pad * 2) - w * scale) / 2;
  const offsetY = pad - minY * scale + ((height - pad * 2) - h * scale) / 2;
  return { scale, offsetX, offsetY };
}

function toScreen(v: Vec2, t: ViewTransform): Vec2 {
  return { x: v.x * t.scale + t.offsetX, y: v.y * t.scale + t.offsetY };
}

function toWorld(screen: Vec2, t: ViewTransform): Vec2 {
  return { x: (screen.x - t.offsetX) / t.scale, y: (screen.y - t.offsetY) / t.scale };
}

interface ModuleViewProps {
  placement: ModulePlacement;
  transform: ViewTransform;
  wall?: Wall;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (worldDelta: Vec2) => void;
}

/** Símbolos arquitectónicos dentro del rect del módulo. `w` y `d` están en
 *  píxeles ya escalados. Las coords locales tienen el origen en la esquina
 *  contra el muro, +x a lo largo del muro y +y hacia el interior. */
function ModuleSymbol({ sku, w, d }: { sku: string; w: number; d: number }) {
  // Sólo dibuja símbolos cuando hay sitio suficiente para que se vean.
  if (w < 18 || d < 18) return null;

  // ─── Fregaderos ─────────────────────────────────────────────────────────
  if (sku === "S-1C-60") {
    const m = Math.min(w, d) * 0.12;
    return (
      <Rect
        x={m} y={m + d * 0.18} width={w - 2 * m} height={d - 2 * m - d * 0.18}
        cornerRadius={Math.min(w, d) * 0.06}
        stroke="#222" strokeWidth={0.8} listening={false}
      />
    );
  }
  if (sku === "S-2C-80") {
    const m = Math.min(w, d) * 0.1;
    const gap = w * 0.03;
    const cw = (w - 2 * m - gap) / 2;
    const ch = d - 2 * m - d * 0.18;
    const r = Math.min(cw, ch) * 0.06;
    return (
      <>
        <Rect x={m} y={m + d * 0.18} width={cw} height={ch}
          cornerRadius={r} stroke="#222" strokeWidth={0.8} listening={false} />
        <Rect x={m + cw + gap} y={m + d * 0.18} width={cw} height={ch}
          cornerRadius={r} stroke="#222" strokeWidth={0.8} listening={false} />
      </>
    );
  }

  // ─── Placas (inducción / gas) ───────────────────────────────────────────
  if (sku === "A-IND-60" || sku === "A-GAS-60") {
    const r = Math.min(w, d) * 0.13;
    const cx1 = w * 0.3, cx2 = w * 0.7;
    const cy1 = d * 0.32, cy2 = d * 0.7;
    return (
      <>
        {[[cx1, cy1],[cx2, cy1],[cx1, cy2],[cx2, cy2]].map(([x, y], i) => (
          <Circle key={i} x={x} y={y} radius={r}
            stroke="#222" strokeWidth={0.8} listening={false} />
        ))}
        {sku === "A-GAS-60" && [[cx1, cy1],[cx2, cy1],[cx1, cy2],[cx2, cy2]].map(([x, y], i) => (
          <Circle key={`g${i}`} x={x} y={y} radius={r * 0.22}
            stroke="#222" strokeWidth={0.6} listening={false} />
        ))}
      </>
    );
  }

  // ─── Horno encastrable ──────────────────────────────────────────────────
  if (sku === "A-HOR-60") {
    return (
      <>
        <Rect x={w * 0.1} y={d * 0.2} width={w * 0.8} height={d * 0.6}
          stroke="#222" strokeWidth={0.8} listening={false} />
        <Line points={[w * 0.3, d * 0.35, w * 0.7, d * 0.35]}
          stroke="#222" strokeWidth={0.6} listening={false} />
        <Circle x={w * 0.5} y={d * 0.7} radius={Math.min(w, d) * 0.04}
          stroke="#222" strokeWidth={0.6} listening={false} />
      </>
    );
  }

  // ─── Lavavajillas ───────────────────────────────────────────────────────
  if (sku === "A-LAV-60") {
    return (
      <>
        <Rect x={w * 0.08} y={d * 0.12} width={w * 0.84} height={d * 0.76}
          stroke="#222" strokeWidth={0.8} listening={false} />
        <Text x={w * 0.5 - 6} y={d * 0.5 - 5} text="LV" fontSize={9}
          fontFamily="ui-monospace, Consolas, monospace"
          fill="#222" listening={false} />
      </>
    );
  }

  // ─── Campana ────────────────────────────────────────────────────────────
  if (sku === "A-CAM-60") {
    return (
      <>
        <Line points={[w * 0.2, d * 0.5, w * 0.5, d * 0.2, w * 0.8, d * 0.5]}
          stroke="#222" strokeWidth={0.9} dash={[4, 3]} listening={false} />
        <Line points={[w * 0.5, d * 0.2, w * 0.5, d * 0.85]}
          stroke="#222" strokeWidth={0.9} dash={[4, 3]} listening={false} />
      </>
    );
  }

  return null;
}

function ModuleView({ placement, transform, wall, selected, onSelect, onDragEnd }: ModuleViewProps) {
  const item = getCatalogItem(placement.sku);
  const groupRef = useRef<Konva.Group>(null);
  if (!item) return null;

  let anchor: Vec2;
  let angleDeg: number;
  if (wall && placement.offsetFromStart !== undefined) {
    const dir = wallDirection(wall);
    const normal = wallInteriorNormal(wall);
    const innerOff = wall.thickness / 2;
    anchor = {
      x: wall.start.x + dir.x * placement.offsetFromStart + normal.x * innerOff,
      y: wall.start.y + dir.y * placement.offsetFromStart + normal.y * innerOff,
    };
    const wallAng = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
    angleDeg = wallAng + ((placement.rotation || 0) * 180) / Math.PI;
  } else if (placement.position) {
    anchor = placement.position;
    angleDeg = (placement.rotation * 180) / Math.PI;
  } else {
    return null;
  }
  const p = toScreen(anchor, transform);
  const w = item.width * transform.scale;
  const d = item.depth * transform.scale;

  // Estilo arquitectónico: contorno fino oscuro + relleno paper o muy tenue
  // matiz por familia. Altos en discontinuo (proyección oculta desde planta),
  // columnas con aspa.
  const isWallUnit = item.family === "wall";
  const isTall = item.family === "tall";
  const fill =
    item.family === "appliance" ? "#eef0f2"
    : item.family === "sink" ? "#e8eef0"
    : item.family === "worktop" ? "#f1ece1"
    : "rgba(0,0,0,0)";
  const stroke = selected ? "#1f6feb" : "#222";
  const strokeWidth = selected ? 1.8 : 0.9;
  const dash = isWallUnit ? [6, 4] : undefined;
  const isJProfile = item.family === "base" || isWallUnit || isTall;

  return (
    <Group
      ref={groupRef}
      x={p.x}
      y={p.y}
      rotation={angleDeg}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        const dx = (newX - p.x) / transform.scale;
        const dy = (newY - p.y) / transform.scale;
        onDragEnd({ x: dx, y: dy });
        e.target.position({ x: p.x, y: p.y });
      }}
    >
      <Rect
        x={0}
        y={0}
        width={w}
        height={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={dash}
      />
      {/* Columna: aspa diagonal indicando "ocupa toda la altura". */}
      {isTall && (
        <>
          <Line points={[0, 0, w, d]} stroke="#222" strokeWidth={0.7} opacity={0.55} listening={false} />
          <Line points={[w, 0, 0, d]} stroke="#222" strokeWidth={0.7} opacity={0.55} listening={false} />
        </>
      )}
      {/* Línea del perfil J en el borde frontal (referencia de orientación). */}
      {isJProfile && (
        <Line
          points={[0, d - 0.5, w, d - 0.5]}
          stroke="#222"
          strokeWidth={1.4}
          listening={false}
        />
      )}
      <ModuleSymbol sku={item.sku} w={w} d={d} />
      {w > 50 && d > 22 && (
        <Text
          x={4}
          y={4}
          text={`${item.sku}\n${Math.round(item.width)}×${Math.round(item.depth)}`}
          fontSize={9}
          fontFamily="ui-monospace, Consolas, monospace"
          fill="#333"
          lineHeight={1.15}
          listening={false}
        />
      )}
    </Group>
  );
}

interface ObstacleViewProps {
  obstacle: Obstacle;
  transform: ViewTransform;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (newPosition: Vec2) => void;
}

function ObstacleView({ obstacle, transform, selected, onSelect, onDragEnd }: ObstacleViewProps) {
  const p = toScreen(obstacle.position, transform);
  const w = obstacle.width * transform.scale;
  const h = obstacle.depth * transform.scale;
  const label = obstacle.label ?? (
    obstacle.kind === "column" ? "COL" :
    obstacle.kind === "pilaster" ? "PIL" :
    obstacle.kind === "beam" ? "BEAM" :
    obstacle.kind === "niche" ? "NIC" : "OBS"
  );
  return (
    <Group
      x={p.x}
      y={p.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        const world = toWorld({ x: newX, y: newY }, transform);
        onDragEnd({ x: Math.round(world.x), y: Math.round(world.y) });
        e.target.position({ x: p.x, y: p.y });
      }}
    >
      {/* Hatching diagonal sobre fondo paper, convención CAD de "macizo". */}
      <Rect x={0} y={0} width={w} height={h} fill="#fafaf7" stroke="transparent" listening={false} />
      {Array.from({ length: Math.ceil((w + h) / 8) }).map((_, i) => {
        const t = (i + 1) * 8;
        // Líneas diagonales a 45° dentro del rect, clipeadas a sus bordes.
        const x0 = Math.max(0, t - h);
        const y0 = Math.max(0, h - t);
        const x1 = Math.min(t, w);
        const y1 = Math.max(0, h - Math.min(t, w) + x0);
        return (
          <Line
            key={i}
            points={[x0, y0, x1, y1]}
            stroke="#222"
            strokeWidth={0.6}
            opacity={0.7}
            listening={false}
          />
        );
      })}
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="transparent"
        stroke={selected ? "#1f6feb" : "#222"}
        strokeWidth={selected ? 1.6 : 0.9}
      />
      {w > 28 && h > 16 && (
        <Text x={4} y={4} text={label} fontSize={9}
          fontFamily="ui-monospace, Consolas, monospace"
          fill="#222" listening={false} />
      )}
    </Group>
  );
}

export function PlantaCanvas() {
  const project = useProject();
  const actions = useActions();
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const placingSku = useStore((s) => s.placingSku);
  const setPlacingSku = useStore((s) => s.setPlacingSku);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cursorWorld, setCursorWorld] = useState<Vec2 | null>(null);
  const [shiftHeld, setShiftHeld] = useState(false);
  /** Konva onClick en una shape se dispara antes que el onClick HTML del
   *  contenedor. Usamos un ref para que el host se entere de que el click
   *  ya tuvo dueño y no coloque un módulo nuevo encima. */
  const swallowHostClickRef = useRef(false);

  /** Llamado por las shapes de Konva al ser clicadas. Selecciona y, si
   *  estábamos colocando, sale del modo colocación. */
  function selectShape(sel: Selection) {
    swallowHostClickRef.current = true;
    setSelection(sel);
    if (placingSku) setPlacingSku(null);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const transform = useMemo(
    () => computeFit(size.width, size.height, project.room.walls),
    [size.width, size.height, project.room.walls],
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!placingSku) {
      if (cursorWorld) setCursorWorld(null);
      return;
    }
    const rect = containerRef.current!.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCursorWorld(toWorld(screen, transform));
    setShiftHeld(e.shiftKey);
  }

  function handleMouseLeave() {
    setCursorWorld(null);
  }

  /** Para SKUs de rincón (-RIN): devuelve el extremo del rango más cercano
   *  a `off`. Garantiza que un módulo rincón vive siempre pegado a una
   *  esquina del muro al que pertenece. */
  function snapToCornerOffset(range: { min: number; max: number }, off: number): number {
    return off < (range.min + range.max) / 2 ? range.min : range.max;
  }

  function isCornerSku(sku: string): boolean {
    return /-RIN(-|$)/.test(sku);
  }

  /** Ajusta `off` para que el borde del módulo se pegue al de un vecino del
   *  mismo muro si está dentro de la tolerancia (220 mm). Devuelve el nuevo
   *  offset o el original si no hay vecino cercano. `excludeId` se omite del
   *  cálculo (para no auto-snap durante un drag). */
  function snapToNeighbours(wallId: string, off: number, width: number, excludeId?: string): number {
    const SNAP = 220; // mm
    const wall = project.room.walls.find((w) => w.id === wallId);
    if (!wall) return off;
    const range = wallUsableRange(wall, project.room.walls, width);
    const neighbours = project.modules
      .filter((m) => m.id !== excludeId && m.wallId === wallId && m.offsetFromStart !== undefined)
      .map((m) => {
        const it = getCatalogItem(m.sku);
        if (!it) return null;
        return { start: m.offsetFromStart!, end: m.offsetFromStart! + it.width };
      })
      .filter((x): x is { start: number; end: number } => x !== null);

    const candidates: number[] = [range.min, range.max];
    for (const n of neighbours) {
      candidates.push(n.end);
      candidates.push(n.start - width);
    }
    let bestOff = off;
    let bestDist = SNAP;
    for (const c of candidates) {
      if (c < range.min - 0.01 || c > range.max + 0.01) continue;
      const d = Math.abs(c - off);
      if (d < bestDist) {
        bestDist = d;
        bestOff = c;
      }
    }
    return bestOff;
  }

  function placeAtCursor(world: Vec2, useFreeIsland: boolean) {
    if (!placingSku) return;
    const item = getCatalogItem(placingSku);
    if (!item) return;
    const snap = nearestWall(world, project.room.walls);
    if (snap && !useFreeIsland) {
      const range = wallUsableRange(snap.wall, project.room.walls, item.width);
      let off = Math.max(range.min, Math.min(range.max, snap.offset - item.width / 2));
      if (isCornerSku(item.sku)) {
        off = snapToCornerOffset(range, off);
      } else {
        off = snapToNeighbours(snap.wall.id, off, item.width);
      }
      const id = actions.addModule({
        sku: placingSku,
        wallId: snap.wall.id,
        offsetFromStart: off,
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    } else {
      // Isla libre: el anchor del rect está en su esquina top-left, así que
      // restamos w/2, d/2 para que el módulo quede centrado en el click.
      const id = actions.addModule({
        sku: placingSku,
        position: { x: world.x - item.width / 2, y: world.y - item.depth / 2 },
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    }
  }

  function handleHostClick(e: React.MouseEvent<HTMLDivElement>) {
    if (swallowHostClickRef.current) {
      swallowHostClickRef.current = false;
      return;
    }
    if (!placingSku) return;
    if (e.button !== 0) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const world = toWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, transform);
    placeAtCursor(world, e.shiftKey);
  }

  // Esc cancela el modo colocación. Shift se trackea por keydown/keyup para
  // que el preview refleje el modificador aunque el ratón esté quieto.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift") {
        setShiftHeld(true);
        return;
      }
      if (e.key === "Escape" && placingSku) {
        e.preventDefault();
        setPlacingSku(null);
        setCursorWorld(null);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift") setShiftHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [placingSku, setPlacingSku]);

  // Borrar con tecla Supr/Backspace mientras el canvas está enfocado lógicamente.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selection) return;
      e.preventDefault();
      if (selection.kind === "module") actions.removeModule(selection.id);
      else if (selection.kind === "obstacle") actions.removeObstacle(selection.id);
      else if (selection.kind === "opening") actions.removeOpening(selection.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, actions]);

  const stageRef = useRef<Konva.Stage>(null);

  // Expose stage globally for PDF export snapshot.
  useEffect(() => {
    setStage(stageRef.current);
    return () => setStage(null);
  }, [size.width, size.height]);

  // Click vacío en el escenario → deseleccionar
  function handleStageClick(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage()) {
      setSelection(null);
    }
  }

  function moveModuleByDelta(m: ModulePlacement, delta: Vec2) {
    const item = getCatalogItem(m.sku);
    if (!item) return;

    if (m.wallId && m.offsetFromStart !== undefined) {
      const wall = project.room.walls.find((w) => w.id === m.wallId);
      if (!wall) return;
      const dir = wallDirection(wall);
      // Posición "intencionada" del ancla del módulo tras el drag, en coords
      // de mundo (sobre el eje del muro original, sin contar inset).
      const oldAnchor = {
        x: wall.start.x + dir.x * m.offsetFromStart,
        y: wall.start.y + dir.y * m.offsetFromStart,
      };
      const newAnchor = {
        x: oldAnchor.x + delta.x,
        y: oldAnchor.y + delta.y,
      };
      const snap = nearestWall(newAnchor, project.room.walls);
      if (!snap) return;

      if (snap.wall.id !== m.wallId) {
        // Cambio de muro: re-centramos sobre el punto al que arrastró el usuario.
        const range = wallUsableRange(snap.wall, project.room.walls, item.width);
        let newOff = Math.max(range.min, Math.min(range.max, snap.offset - item.width / 2));
        if (isCornerSku(m.sku)) newOff = snapToCornerOffset(range, newOff);
        actions.updateModule(m.id, {
          wallId: snap.wall.id,
          offsetFromStart: newOff,
        });
      } else {
        // Mismo muro: deslizamos a lo largo del muro por la componente del
        // delta proyectada sobre la dirección.
        const along = delta.x * dir.x + delta.y * dir.y;
        const range = wallUsableRange(wall, project.room.walls, item.width);
        let next = Math.max(range.min, Math.min(range.max, m.offsetFromStart + along));
        if (isCornerSku(m.sku)) next = snapToCornerOffset(range, next);
        actions.updateModule(m.id, { offsetFromStart: next });
      }
    } else if (m.position) {
      // Para módulos libres que ya están colocados, sólo re-anclamos si el
       // usuario los arrastra explícitamente cerca de un muro (400 mm).
      const newPos = { x: m.position.x + delta.x, y: m.position.y + delta.y };
      const snap = nearestWall(newPos, project.room.walls);
      if (snap && snap.distance <= 400) {
        const range = wallUsableRange(snap.wall, project.room.walls, item.width);
        let off = Math.max(range.min, Math.min(range.max, snap.offset - item.width / 2));
        if (isCornerSku(m.sku)) off = snapToCornerOffset(range, off);
        actions.updateModule(m.id, {
          wallId: snap.wall.id,
          offsetFromStart: off,
          position: undefined,
        });
      } else {
        actions.updateModule(m.id, { position: { x: Math.round(newPos.x), y: Math.round(newPos.y) } });
      }
    }
  }

  // Render
  const polyPoints = project.room.walls.flatMap((w) => {
    const p = toScreen(w.start, transform);
    return [p.x, p.y];
  });
  if (polyPoints.length > 0) {
    const first = toScreen(project.room.walls[0].start, transform);
    polyPoints.push(first.x, first.y);
  }

  // Bbox de la habitación para dibujar la rejilla técnica (100 mm fina,
  // 1000 mm fuerte). Sólo dibujamos líneas dentro del rectángulo envolvente
  // ampliado un poco para que no se corte en los bordes.
  const xs = project.room.walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = project.room.walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = xs.length ? Math.min(...xs) - 200 : 0;
  const maxX = xs.length ? Math.max(...xs) + 200 : 0;
  const minY = ys.length ? Math.min(...ys) - 200 : 0;
  const maxY = ys.length ? Math.max(...ys) + 200 : 0;
  const minXr = Math.floor(minX / 100) * 100;
  const maxXr = Math.ceil(maxX / 100) * 100;
  const minYr = Math.floor(minY / 100) * 100;
  const maxYr = Math.ceil(maxY / 100) * 100;
  const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number; major: boolean }> = [];
  for (let xmm = minXr; xmm <= maxXr; xmm += 100) {
    const major = xmm % 1000 === 0;
    const a = toScreen({ x: xmm, y: minYr }, transform);
    const b = toScreen({ x: xmm, y: maxYr }, transform);
    gridLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, major });
  }
  for (let ymm = minYr; ymm <= maxYr; ymm += 100) {
    const major = ymm % 1000 === 0;
    const a = toScreen({ x: minXr, y: ymm }, transform);
    const b = toScreen({ x: maxXr, y: ymm }, transform);
    gridLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, major });
  }

  // Preview en vivo del módulo a colocar mientras el cursor está sobre la planta.
  const livePreview = (() => {
    if (!placingSku || !cursorWorld) return null;
    const item = getCatalogItem(placingSku);
    const snap = nearestWall(cursorWorld, project.room.walls);
    if (snap && !shiftHeld) {
      const w = item?.width ?? 0;
      const range = wallUsableRange(snap.wall, project.room.walls, w);
      let off = Math.max(range.min, Math.min(range.max, snap.offset - w / 2));
      off = snapToNeighbours(snap.wall.id, off, w);
      return { world: cursorWorld, wallId: snap.wall.id, offset: off, sku: placingSku };
    }
    // Isla libre: centramos el rect en el cursor también en el preview.
    if (item) {
      return {
        world: { x: cursorWorld.x - item.width / 2, y: cursorWorld.y - item.depth / 2 },
        wallId: null,
        offset: 0,
        sku: placingSku,
      };
    }
    return { world: cursorWorld, wallId: null, offset: 0, sku: placingSku };
  })();

  return (
    <div
      ref={containerRef}
      className={`planta-host ${placingSku ? "placing" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleHostClick}
    >
      <div className="planta-hint">
        {placingSku
          ? <>Click en la planta para colocar <strong>{placingSku}</strong> · <kbd>Shift</kbd>+click = isla libre · <kbd>Esc</kbd> cancela</>
          : <>Click en una card del catálogo a la izquierda, luego click en la planta donde quieras el módulo.</>}
      </div>
      {size.width > 0 && size.height > 0 && (
        <Stage ref={stageRef} width={size.width} height={size.height} onMouseDown={handleStageClick} onTouchStart={handleStageClick}>
          {/* L0: rejilla técnica de fondo */}
          <Layer listening={false}>
            {gridLines.map((g, i) => (
              <Line
                key={i}
                points={[g.x1, g.y1, g.x2, g.y2]}
                stroke="#000"
                strokeWidth={g.major ? 0.5 : 0.3}
                opacity={g.major ? 0.18 : 0.07}
              />
            ))}
          </Layer>
          {/* L1: suelo de la habitación (paper más blanco) */}
          <Layer listening={false}>
            <Line points={polyPoints} closed fill="#ffffff" stroke="transparent" />
          </Layer>
          <Layer>
            {/* Muros: cajones rellenos mostrando el grosor real. */}
            {project.room.walls.map((w) => {
              const dirN = wallDirection(w);
              const norm = wallInteriorNormal(w);
              const t = w.thickness / 2;
              const c0 = toScreen({ x: w.start.x - norm.x * t, y: w.start.y - norm.y * t }, transform);
              const c1 = toScreen({ x: w.end.x - norm.x * t, y: w.end.y - norm.y * t }, transform);
              const c2 = toScreen({ x: w.end.x + norm.x * t, y: w.end.y + norm.y * t }, transform);
              const c3 = toScreen({ x: w.start.x + norm.x * t, y: w.start.y + norm.y * t }, transform);
              void dirN;
              return (
                <Line
                  key={w.id}
                  points={[c0.x, c0.y, c1.x, c1.y, c2.x, c2.y, c3.x, c3.y]}
                  closed
                  fill="#2c2c2c"
                  stroke="#111"
                  strokeWidth={0.6}
                  listening={false}
                />
              );
            })}
            {/* Huecos: cortamos el muro con un rect en color paper y
                 dibujamos la simbología arquitectónica (arco / doble línea). */}
            {project.room.openings.map((op) => {
              const wall = project.room.walls.find((w) => w.id === op.wallId);
              if (!wall) return null;
              const dir = wallDirection(wall);
              const normal = wallInteriorNormal(wall);
              const t = wall.thickness / 2;
              const a0 = {
                x: wall.start.x + dir.x * op.offsetFromStart - normal.x * t,
                y: wall.start.y + dir.y * op.offsetFromStart - normal.y * t,
              };
              const a1 = {
                x: wall.start.x + dir.x * (op.offsetFromStart + op.width) - normal.x * t,
                y: wall.start.y + dir.y * (op.offsetFromStart + op.width) - normal.y * t,
              };
              const a2 = {
                x: wall.start.x + dir.x * (op.offsetFromStart + op.width) + normal.x * t,
                y: wall.start.y + dir.y * (op.offsetFromStart + op.width) + normal.y * t,
              };
              const a3 = {
                x: wall.start.x + dir.x * op.offsetFromStart + normal.x * t,
                y: wall.start.y + dir.y * op.offsetFromStart + normal.y * t,
              };
              const p0 = toScreen(a0, transform);
              const p1 = toScreen(a1, transform);
              const p2 = toScreen(a2, transform);
              const p3 = toScreen(a3, transform);
              const isSel = selection?.kind === "opening" && selection.id === op.id;
              const isDoor = op.kind === "door";
              const inn0 = toScreen({
                x: wall.start.x + dir.x * op.offsetFromStart + normal.x * t,
                y: wall.start.y + dir.y * op.offsetFromStart + normal.y * t,
              }, transform);
              const dirAngleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
              const normalAngleDeg = (Math.atan2(normal.y, normal.x) * 180) / Math.PI;
              const delta = ((normalAngleDeg - dirAngleDeg + 540) % 360) - 180;
              const sweep = delta > 0 ? 90 : -90;
              return (
                <Group key={op.id}>
                  {/* Cut blanco que tapa el muro */}
                  <Line
                    points={[p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]}
                    closed
                    fill="#ffffff"
                    stroke={isSel ? "#1f6feb" : "transparent"}
                    strokeWidth={isSel ? 1.5 : 0}
                    hitStrokeWidth={20}
                    onClick={() => selectShape({ kind: "opening", id: op.id })}
                    onTap={() => selectShape({ kind: "opening", id: op.id })}
                  />
                  {isDoor ? (
                    <>
                      {/* Hoja de la puerta: una línea desde la bisagra hacia el interior */}
                      <Line
                        points={[
                          inn0.x, inn0.y,
                          inn0.x + dir.x * op.width * transform.scale,
                          inn0.y + dir.y * op.width * transform.scale,
                        ]}
                        stroke="#222"
                        strokeWidth={1.1}
                        listening={false}
                      />
                      {/* Arco de barrido */}
                      <Arc
                        x={inn0.x}
                        y={inn0.y}
                        innerRadius={0}
                        outerRadius={op.width * transform.scale}
                        angle={sweep}
                        rotation={dirAngleDeg}
                        stroke="#222"
                        strokeWidth={0.7}
                        dash={[3, 3]}
                        opacity={0.85}
                        listening={false}
                      />
                    </>
                  ) : (
                    <>
                      {/* Ventana: doble línea fina cruzando el grosor del muro */}
                      <Line
                        points={[p0.x + (p3.x - p0.x) * 0.33, p0.y + (p3.y - p0.y) * 0.33,
                                 p1.x + (p2.x - p1.x) * 0.33, p1.y + (p2.y - p1.y) * 0.33]}
                        stroke="#222" strokeWidth={0.8} listening={false}
                      />
                      <Line
                        points={[p0.x + (p3.x - p0.x) * 0.66, p0.y + (p3.y - p0.y) * 0.66,
                                 p1.x + (p2.x - p1.x) * 0.66, p1.y + (p2.y - p1.y) * 0.66]}
                        stroke="#222" strokeWidth={0.8} listening={false}
                      />
                    </>
                  )}
                </Group>
              );
            })}
            {/* Encimera: contorno discontinuo + fill muy tenue */}
            {(() => {
              const worktopDepth = project.worktop?.depth ?? 620;
              const shapes = computeWorktopShapes(project);
              const fill = "rgba(218,205,170,0.18)";
              const stroke = "#9a8c6b";
              const dashed = [5, 4];
              return shapes.map((s, i) => {
                if (s.kind === "wall-band") {
                  const wall = project.room.walls.find((w) => w.id === s.wallId);
                  if (!wall) return null;
                  const dir = wallDirection(wall);
                  const normal = wallInteriorNormal(wall);
                  const innerOff = wall.thickness / 2;
                  const anchor = {
                    x: wall.start.x + dir.x * s.start + normal.x * innerOff,
                    y: wall.start.y + dir.y * s.start + normal.y * innerOff,
                  };
                  const p = toScreen(anchor, transform);
                  const angleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
                  return (
                    <Group key={`wt_${i}`} x={p.x} y={p.y} rotation={angleDeg} listening={false}>
                      <Rect x={0} y={0}
                        width={(s.end - s.start) * transform.scale}
                        height={worktopDepth * transform.scale}
                        fill={fill} stroke={stroke} strokeWidth={0.8} dash={dashed} />
                    </Group>
                  );
                }
                if (s.kind === "corner-fill") {
                  const half = (s.size * transform.scale) / 2;
                  const c = toScreen(s.center, transform);
                  return (
                    <Rect
                      key={`wt_${i}`}
                      x={c.x - half}
                      y={c.y - half}
                      width={s.size * transform.scale}
                      height={s.size * transform.scale}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={0.8}
                      dash={dashed}
                      listening={false}
                    />
                  );
                }
                const center = toScreen({ x: s.centerX, y: s.centerY }, transform);
                const w = s.width * transform.scale;
                const d = s.depth * transform.scale;
                return (
                  <Group key={`wt_${i}`}
                    x={center.x} y={center.y}
                    rotation={(s.rotationRad * 180) / Math.PI}
                    listening={false}
                    offsetX={w / 2} offsetY={d / 2}>
                    <Rect x={0} y={0} width={w} height={d}
                      fill={fill} stroke={stroke} strokeWidth={0.8} dash={dashed} />
                  </Group>
                );
              });
            })()}
            {/* Obstáculos */}
            {(project.room.obstacles ?? []).map((o) => (
              <ObstacleView
                key={o.id}
                obstacle={o}
                transform={transform}
                selected={selection?.kind === "obstacle" && selection.id === o.id}
                onSelect={() => selectShape({ kind: "obstacle", id: o.id })}
                onDragEnd={(newPos) => actions.updateObstacle(o.id, { position: newPos })}
              />
            ))}
            {/* Módulos */}
            {project.modules.map((m) => {
              const wall = m.wallId ? project.room.walls.find((w) => w.id === m.wallId) : undefined;
              return (
                <ModuleView
                  key={m.id}
                  placement={m}
                  transform={transform}
                  wall={wall}
                  selected={selection?.kind === "module" && selection.id === m.id}
                  onSelect={() => selectShape({ kind: "module", id: m.id })}
                  onDragEnd={(delta) => moveModuleByDelta(m, delta)}
                />
              );
            })}
            {/* Preview de colocación (drag o click-to-place) */}
            {livePreview && (() => {
              const item = getCatalogItem(livePreview.sku);
              if (!item) {
                const p = toScreen(livePreview.world, transform);
                return (
                  <Circle
                    x={p.x}
                    y={p.y}
                    radius={10}
                    stroke="#bbbbbb"
                    strokeWidth={2}
                    dash={[6, 4]}
                    listening={false}
                  />
                );
              }
              if (livePreview.wallId) {
                const wall = project.room.walls.find((w) => w.id === livePreview.wallId);
                if (!wall) return null;
                const dir = wallDirection(wall);
                const normal = wallInteriorNormal(wall);
                const innerOff = wall.thickness / 2;
                const anchorWorld = {
                  x: wall.start.x + dir.x * livePreview.offset + normal.x * innerOff,
                  y: wall.start.y + dir.y * livePreview.offset + normal.y * innerOff,
                };
                const p = toScreen(anchorWorld, transform);
                const angleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
                const wallA = toScreen(wall.start, transform);
                const wallB = toScreen(wall.end, transform);
                return (
                  <>
                    <Line
                      points={[wallA.x, wallA.y, wallB.x, wallB.y]}
                      stroke="#1f6feb"
                      strokeWidth={Math.max(4, wall.thickness * transform.scale)}
                      opacity={0.35}
                      lineCap="round"
                      listening={false}
                    />
                    <Group x={p.x} y={p.y} rotation={angleDeg} listening={false}>
                      <Rect
                        x={0}
                        y={0}
                        width={item.width * transform.scale}
                        height={item.depth * transform.scale}
                        fill="#1f6feb"
                        opacity={0.18}
                        stroke="#1f6feb"
                        strokeWidth={2}
                        dash={[6, 4]}
                      />
                    </Group>
                  </>
                );
              }
              const p = toScreen(livePreview.world, transform);
              const w = item.width * transform.scale;
              const d = item.depth * transform.scale;
              return (
                <Rect
                  x={p.x}
                  y={p.y}
                  width={w}
                  height={d}
                  fill="#888"
                  opacity={0.18}
                  stroke="#888"
                  strokeWidth={2}
                  dash={[6, 4]}
                  listening={false}
                />
              );
            })()}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
