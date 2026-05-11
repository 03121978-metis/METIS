import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Group, Text, Circle } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useProject, useActions, useStore } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { nearestWall, wallDirection, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Obstacle, Vec2, Wall } from "../kitchen/types";

interface ViewTransform {
  scale: number; // px por mm
  offsetX: number;
  offsetY: number;
}

const SNAP_TOLERANCE_MM = 600;

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
    anchor = {
      x: wall.start.x + dir.x * placement.offsetFromStart,
      y: wall.start.y + dir.y * placement.offsetFromStart,
    };
    angleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
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
        // Konva keeps the new position; we'll re-render from updated store on next tick.
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
      {w > 36 && d > 18 && (
        <Text x={4} y={4} text={item.sku} fontSize={11} fill="#222" />
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dropPreview, setDropPreview] = useState<{ p: Vec2; wallId: string | null } | null>(null);

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

  function getDropWorld(e: React.DragEvent<HTMLDivElement>): Vec2 {
    const rect = containerRef.current!.getBoundingClientRect();
    return toWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, transform);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("application/x-kitchen-sku")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const world = getDropWorld(e);
    const snap = nearestWall(world, project.room.walls);
    if (snap && snap.distance <= SNAP_TOLERANCE_MM) {
      setDropPreview({ p: snap.foot, wallId: snap.wall.id });
    } else {
      setDropPreview({ p: world, wallId: null });
    }
  }

  function handleDragLeave() {
    setDropPreview(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const sku = e.dataTransfer.getData("application/x-kitchen-sku");
    setDropPreview(null);
    if (!sku) return;
    const item = getCatalogItem(sku);
    if (!item) return;

    const world = getDropWorld(e);
    const snap = nearestWall(world, project.room.walls);

    if (snap && snap.distance <= SNAP_TOLERANCE_MM) {
      const len = wallLength(snap.wall);
      const off = Math.max(0, Math.min(len - item.width, snap.offset - item.width / 2));
      const id = actions.addModule({
        sku,
        wallId: snap.wall.id,
        offsetFromStart: off,
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    } else {
      const id = actions.addModule({
        sku,
        position: world,
        rotation: 0,
      });
      setSelection({ kind: "module", id });
    }
  }

  // Borrar con tecla Supr/Backspace mientras el canvas está enfocado lógicamente.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selection) return;
      e.preventDefault();
      if (selection.kind === "module") actions.removeModule(selection.id);
      else actions.removeObstacle(selection.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, actions]);

  const stageRef = useRef<Konva.Stage>(null);

  // Click vacío en el escenario → deseleccionar
  function handleStageClick(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage()) {
      setSelection(null);
    }
  }

  function moveModuleByDelta(m: ModulePlacement, delta: Vec2) {
    if (m.wallId && m.offsetFromStart !== undefined) {
      const wall = project.room.walls.find((w) => w.id === m.wallId);
      if (!wall) return;
      const dir = wallDirection(wall);
      // Componente del delta a lo largo del muro
      const along = delta.x * dir.x + delta.y * dir.y;
      const item = getCatalogItem(m.sku);
      if (!item) return;
      const len = wallLength(wall);
      const next = Math.max(0, Math.min(len - item.width, m.offsetFromStart + along));
      actions.updateModule(m.id, { offsetFromStart: next });
    } else if (m.position) {
      // Posible re-snap a muro si entra en tolerancia
      const newPos = { x: m.position.x + delta.x, y: m.position.y + delta.y };
      const snap = nearestWall(newPos, project.room.walls);
      const item = getCatalogItem(m.sku);
      if (snap && item && snap.distance <= SNAP_TOLERANCE_MM) {
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

  return (
    <div
      ref={containerRef}
      className="planta-host"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
              return (
                <Line
                  key={op.id}
                  points={[pa.x, pa.y, pb.x, pb.y]}
                  stroke={op.kind === "door" ? "#8e6b3a" : "#5a9fd6"}
                  strokeWidth={Math.max(6, wall.thickness * transform.scale + 2)}
                  lineCap="butt"
                  listening={false}
                />
              );
            })}
            {/* Obstáculos */}
            {(project.room.obstacles ?? []).map((o) => (
              <ObstacleView
                key={o.id}
                obstacle={o}
                transform={transform}
                selected={selection?.kind === "obstacle" && selection.id === o.id}
                onSelect={() => setSelection({ kind: "obstacle", id: o.id })}
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
                  onSelect={() => setSelection({ kind: "module", id: m.id })}
                  onDragEnd={(delta) => moveModuleByDelta(m, delta)}
                />
              );
            })}
            {/* Preview de drop */}
            {dropPreview && (() => {
              const p = toScreen(dropPreview.p, transform);
              return (
                <Circle
                  x={p.x}
                  y={p.y}
                  radius={10}
                  stroke={dropPreview.wallId ? "#1f6feb" : "#bbbbbb"}
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
