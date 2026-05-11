import { useEffect, useState } from "react";
import { useProject, useStore } from "../store";

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
  const setRoomDimensions = useStore((s) => s.actions.setRoomDimensions);

  const bbox = bboxOf(project.room.walls);
  const [width, setWidth] = useState<number>(bbox.width);
  const [depth, setDepth] = useState<number>(bbox.depth);
  const [ceiling, setCeiling] = useState<number>(project.room.ceilingHeight);

  // Re-sync inputs if the room is reset externally.
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
    setRoomDimensions(w, d, c);
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
          <input
            type="number"
            min={500}
            step={50}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            onBlur={() => commit({ w: width })}
          />
        </label>
        <label>
          <span>Fondo</span>
          <input
            type="number"
            min={500}
            step={50}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            onBlur={() => commit({ d: depth })}
          />
        </label>
        <label>
          <span>Techo</span>
          <input
            type="number"
            min={2000}
            step={10}
            value={ceiling}
            onChange={(e) => setCeiling(Number(e.target.value))}
            onBlur={() => commit({ c: ceiling })}
          />
        </label>
        <div className="room-presets">
          <button type="button" onClick={() => { setWidth(3000); setDepth(3000); setCeiling(2400); commit({ w: 3000, d: 3000, c: 2400 }); }}>3×3</button>
          <button type="button" onClick={() => { setWidth(4000); setDepth(3000); setCeiling(2400); commit({ w: 4000, d: 3000, c: 2400 }); }}>4×3</button>
          <button type="button" onClick={() => { setWidth(5000); setDepth(3500); setCeiling(2500); commit({ w: 5000, d: 3500, c: 2500 }); }}>5×3.5</button>
        </div>
      </div>
    </>
  );
}
