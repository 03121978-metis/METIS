import { useEffect, useState } from "react";
import { useProject, useStore } from "../store";
import { wallLength } from "../kitchen/validation";

function bboxOf(walls: { start: { x: number; y: number }; end: { x: number; y: number } }[]) {
  const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...ys) - Math.min(...ys),
  };
}

export function RoomPanel() {
  const project = useProject();
  const actions = useStore((s) => s.actions);
  const setSelection = useStore((s) => s.setSelection);

  const bbox = bboxOf(project.room.walls);
  const [width, setWidth] = useState<number>(bbox.width);
  const [depth, setDepth] = useState<number>(bbox.depth);
  const [ceiling, setCeiling] = useState<number>(project.room.ceilingHeight);

  useEffect(() => {
    setWidth(bbox.width);
    setDepth(bbox.depth);
    setCeiling(project.room.ceilingHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  function commit(next: { w?: number; d?: number; c?: number }) {
    const w = next.w ?? width;
    const d = next.d ?? depth;
    const c = next.c ?? ceiling;
    actions.setRoomDimensions(w, d, c);
  }

  function addDoor() {
    const wall = project.room.walls[0];
    if (!wall) return;
    const len = wallLength(wall);
    const w = Math.min(820, Math.max(700, len * 0.3));
    const id = actions.addOpening({
      wallId: wall.id,
      kind: "door",
      offsetFromStart: Math.max(0, (len - w) / 2),
      width: w,
      height: 2100,
    });
    setSelection({ kind: "opening", id });
  }

  function addWindow() {
    const wall = project.room.walls[0];
    if (!wall) return;
    const len = wallLength(wall);
    const w = Math.min(1200, Math.max(600, len * 0.4));
    const id = actions.addOpening({
      wallId: wall.id,
      kind: "window",
      offsetFromStart: Math.max(0, (len - w) / 2),
      width: w,
      height: 1200,
      sillHeight: 900,
    });
    setSelection({ kind: "opening", id });
  }

  return (
    <>
      <div className="sidebar-header">
        <h2>Habitación</h2>
        <small>mm</small>
      </div>
      <div className="room-form">
        <label>
          <span>Ancho</span>
          <input type="number" min={500} step={50} value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            onBlur={() => commit({ w: width })} />
        </label>
        <label>
          <span>Fondo</span>
          <input type="number" min={500} step={50} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            onBlur={() => commit({ d: depth })} />
        </label>
        <label>
          <span>Techo</span>
          <input type="number" min={2000} step={10} value={ceiling}
            onChange={(e) => setCeiling(Number(e.target.value))}
            onBlur={() => commit({ c: ceiling })} />
        </label>
        <div className="room-presets">
          <button type="button" onClick={() => { setWidth(3000); setDepth(3000); setCeiling(2400); commit({ w: 3000, d: 3000, c: 2400 }); }}>3×3</button>
          <button type="button" onClick={() => { setWidth(4000); setDepth(3000); setCeiling(2400); commit({ w: 4000, d: 3000, c: 2400 }); }}>4×3</button>
          <button type="button" onClick={() => { setWidth(5000); setDepth(3500); setCeiling(2500); commit({ w: 5000, d: 3500, c: 2500 }); }}>5×3.5</button>
        </div>
        <div className="room-add">
          <button type="button" onClick={() => {
            const id = actions.addObstacle({
              kind: "column",
              position: { x: Math.round(width / 2 - 150), y: Math.round(depth / 2 - 150) },
              width: 300, depth: 300, height: project.room.ceilingHeight,
            });
            setSelection({ kind: "obstacle", id });
          }}>+ Columna</button>
          <button type="button" onClick={() => {
            const id = actions.addObstacle({
              kind: "pilaster",
              position: { x: 100, y: 100 },
              width: 400, depth: 200, height: project.room.ceilingHeight,
            });
            setSelection({ kind: "obstacle", id });
          }}>+ Pilastra</button>
        </div>
        <div className="room-add">
          <button type="button" onClick={addDoor}>+ Puerta</button>
          <button type="button" onClick={addWindow}>+ Ventana</button>
        </div>
        <label className="room-worktop">
          <span>Encimera</span>
          <select
            value={project.worktop?.mode ?? "over-modules"}
            onChange={(e) => actions.setWorktop({ mode: e.target.value as "none" | "over-modules" | "full-wall" })}
          >
            <option value="none">Sin encimera</option>
            <option value="over-modules">Sobre los muebles</option>
            <option value="full-wall">Todo el muro</option>
          </select>
        </label>
      </div>
    </>
  );
}
