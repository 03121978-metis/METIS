import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Group, Text, Circle, Arc } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useProject, useActions, useStore } from "../store";
import type { Selection } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { nearestWall, wallDirection, wallInteriorNormal, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Obstacle, Vec2, Wall } from "../kitchen/types";
import { setStage } from "../lib/stageRef";

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

  const color =
    item.family === "base" ? "#d8c9b3"
    : item.family === "wall" ? "#cfe1ce"
    : item.family === "tall" ? "#dac8a8"
    : item.family === "appliance" ? "#aeb6c1"
    : item.family === "sink" ? "#b6d3df"
    : item.family === "worktop" ? "#e8d9b9"
    : "#e2dccb";

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
        fill={color}
        stroke={selected ? "#1f6feb" : "#3a3a3a"}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Triángulo indicando el frente del módulo (lado interior de la pared). */}
      <Line
        points={
          placement.mirrored
            ? [w * 0.75, 1, w * 0.25, 1, w / 2, Math.min(d * 0.3, 10)]
            : [w * 0.25, 1, w * 0.75, 1, w / 2, Math.min(d * 0.3, 10)]
        }
        closed
        fill={selected ? "#1f6feb" : "#444"}
        opacity={0.5}
        listening={false}
      />
      {w > 36 && d > 18 && (
        <Text x={4} y={Math.min(14, d - 14)} text={item.sku} fontSize={11} fill="#222" listening={false} />
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
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="#9c9c9c"
        opacity={0.85}
        stroke={selected ? "#1f6feb" : "#404040"}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Hatching diagonal sencilla */}
      {Array.from({ length: Math.ceil((w + h) / 12) }).map((_, i) => {
        const t = i * 12;
        return (
          <Line
            key={i}
            points={[t, 0, 0, t]}
            stroke="#5a5a5a"
            strokeWidth={1}
            opacity={0.4}
            listening={false}
          />
        );
      })}
      {w > 24 && h > 14 && (
        <Text x={4} y={4} text={label} fontSize={10} fill="#fff" fontStyle="bold" />
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

  /** Ajusta `off` para que el borde del módulo se pegue al de un vecino del
   *  mismo muro si está dentro de la tolerancia (150 mm). Devuelve el nuevo
   *  offset o el original si no hay vecino cercano. */
  function snapToNeighbours(wallId: string, off: number, width: number): number {
    const SNAP = 150; // mm
    const len = wallLength(project.room.walls.find((w) => w.id === wallId)!);
    const neighbours = project.modules
      .filter((m) => m.wallId === wallId && m.offsetFromStart !== undefined)
      .map((m) => {
        const it = getCatalogItem(m.sku);
        if (!it) return null;
        return { start: m.offsetFromStart!, end: m.offsetFromStart! + it.width };
      })
      .filter((x): x is { start: number; end: number } => x !== null)
      .sort((a, b) => a.start - b.start);

    // Candidatos a pegar: extremos del muro y bordes de vecinos.
    const candidates: number[] = [0, len - width];
    for (const n of neighbours) {
      candidates.push(n.end);             // mi izquierda contra su derecha
      candidates.push(n.start - width);   // mi derecha contra su izquierda
    }
    let bestOff = off;
    let bestDist = SNAP;
    for (const c of candidates) {
      if (c < 0 || c > len - width) continue;
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
      const len = wallLength(snap.wall);
      let off = Math.max(0, Math.min(len - item.width, snap.offset - item.width / 2));
      off = snapToNeighbours(snap.wall.id, off, item.width);
      const id = actions.addModule({
        sku: placingSku,
        wallId: snap.wall.id,
        offsetFromStart: off,
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    } else {
      const id = actions.addModule({
        sku: placingSku,
        position: world,
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    }
    // Modo multi-place: NO salimos del modo. Esc o click sobre la card para
    // terminar.
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

  // Esc cancela el modo colocación.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && placingSku) {
        e.preventDefault();
        setPlacingSku(null);
        setCursorWorld(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        const newLen = wallLength(snap.wall);
        const newOff = Math.max(0, Math.min(newLen - item.width, snap.offset - item.width / 2));
        actions.updateModule(m.id, {
          wallId: snap.wall.id,
          offsetFromStart: newOff,
        });
      } else {
        // Mismo muro: deslizamos a lo largo del muro por la componente del
        // delta proyectada sobre la dirección.
        const along = delta.x * dir.x + delta.y * dir.y;
        const len = wallLength(wall);
        const next = Math.max(0, Math.min(len - item.width, m.offsetFromStart + along));
        actions.updateModule(m.id, { offsetFromStart: next });
      }
    } else if (m.position) {
      // Para módulos libres que ya están colocados, sólo re-anclamos si el
       // usuario los arrastra explícitamente cerca de un muro (400 mm).
      const newPos = { x: m.position.x + delta.x, y: m.position.y + delta.y };
      const snap = nearestWall(newPos, project.room.walls);
      if (snap && snap.distance <= 400) {
        const len = wallLength(snap.wall);
        const off = Math.max(0, Math.min(len - item.width, snap.offset - item.width / 2));
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

  // Preview en vivo del módulo a colocar mientras el cursor está sobre la planta.
  const livePreview = (() => {
    if (!placingSku || !cursorWorld) return null;
    const item = getCatalogItem(placingSku);
    const snap = nearestWall(cursorWorld, project.room.walls);
    if (snap && !shiftHeld) {
      const len = wallLength(snap.wall);
      const w = item?.width ?? 0;
      const off = Math.max(0, Math.min(Math.max(0, len - w), snap.offset - w / 2));
      return { world: cursorWorld, wallId: snap.wall.id, offset: off, sku: placingSku };
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
          <Layer listening={false}>
            <Line points={polyPoints} closed fill="#fafaf6" stroke="#bdb6a8" strokeWidth={1} />
          </Layer>
          <Layer>
            {/* Muros */}
            {project.room.walls.map((w) => {
              const a = toScreen(w.start, transform);
              const b = toScreen(w.end, transform);
              return (
                <Line
                  key={w.id}
                  points={[a.x, a.y, b.x, b.y]}
                  stroke="#2b2b2b"
                  strokeWidth={Math.max(4, w.thickness * transform.scale)}
                  lineCap="round"
                  listening={false}
                />
              );
            })}
            {/* Huecos */}
            {project.room.openings.map((op) => {
              const wall = project.room.walls.find((w) => w.id === op.wallId);
              if (!wall) return null;
              const dir = wallDirection(wall);
              const normal = wallInteriorNormal(wall);
              const a = {
                x: wall.start.x + dir.x * op.offsetFromStart,
                y: wall.start.y + dir.y * op.offsetFromStart,
              };
              const b = {
                x: wall.start.x + dir.x * (op.offsetFromStart + op.width),
                y: wall.start.y + dir.y * (op.offsetFromStart + op.width),
              };
              const pa = toScreen(a, transform);
              const pb = toScreen(b, transform);
              const isSel = selection?.kind === "opening" && selection.id === op.id;
              const isDoor = op.kind === "door";
              // Arco de barrido para puertas: cuarto de círculo desde la
              // bisagra (extremo "a") apuntando hacia el interior, radio =
              // ancho del hueco.
              const dirAngleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
              const normalAngleDeg = (Math.atan2(normal.y, normal.x) * 180) / Math.PI;
              // El Arc de Konva empieza en angle 0 (eje +x) y barre `angle` grados.
              // Queremos que empiece en la dirección del muro y barra hacia el interior.
              // Si la rotación del normal está a -90° de la dirección, hacemos angle=-90
              // y rotation=dirAngle; si está a +90°, angle=90 y rotation=dirAngle.
              const delta = ((normalAngleDeg - dirAngleDeg + 540) % 360) - 180; // signed
              const sweep = delta > 0 ? 90 : -90;
              return (
                <Group key={op.id}>
                  <Line
                    points={[pa.x, pa.y, pb.x, pb.y]}
                    stroke={isDoor ? "#8e6b3a" : "#5a9fd6"}
                    strokeWidth={Math.max(6, wall.thickness * transform.scale + 2)}
                    shadowEnabled={isSel}
                    shadowColor="#1f6feb"
                    shadowBlur={isSel ? 10 : 0}
                    lineCap="butt"
                    hitStrokeWidth={20}
                    onClick={() => selectShape({ kind: "opening", id: op.id })}
                    onTap={() => selectShape({ kind: "opening", id: op.id })}
                  />
                  {isDoor && (
                    <>
                      <Arc
                        x={pa.x}
                        y={pa.y}
                        innerRadius={0}
                        outerRadius={op.width * transform.scale}
                        angle={sweep}
                        rotation={dirAngleDeg}
                        stroke="#8e6b3a"
                        strokeWidth={1}
                        dash={[4, 4]}
                        opacity={0.7}
                        listening={false}
                      />
                      <Line
                        points={[
                          pa.x,
                          pa.y,
                          pa.x + dir.x * op.width * transform.scale,
                          pa.y + dir.y * op.width * transform.scale,
                        ]}
                        stroke="#8e6b3a"
                        strokeWidth={1}
                        opacity={0.7}
                        listening={false}
                      />
                    </>
                  )}
                  {!isDoor && (
                    <Line
                      points={[pa.x, pa.y, pb.x, pb.y]}
                      stroke="#fff"
                      strokeWidth={Math.max(2, wall.thickness * transform.scale * 0.4)}
                      lineCap="butt"
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
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
                  x={p.x - w / 2}
                  y={p.y - d / 2}
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
