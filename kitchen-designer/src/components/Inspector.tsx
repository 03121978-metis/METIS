import { useProject, useStore } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallLength } from "../kitchen/validation";
import type { Obstacle, ObstacleKind } from "../kitchen/types";

const OBSTACLE_LABELS: Record<ObstacleKind, string> = {
  column: "Columna",
  pilaster: "Pilastra",
  niche: "Hornacina",
  beam: "Viga (suelo)",
  generic: "Obstáculo",
};

export function Inspector() {
  const project = useProject();
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const actions = useStore((s) => s.actions);

  if (!selection) {
    return (
      <>
        <div className="sidebar-header">
          <h2>Selección</h2>
        </div>
        <div className="inspector-empty">
          Toca un módulo u obstáculo en la planta para editarlo. <br />
          Supr / Backspace lo elimina.
        </div>
      </>
    );
  }

  if (selection.kind === "module") {
    const m = project.modules.find((x) => x.id === selection.id);
    if (!m) return null;
    const item = getCatalogItem(m.sku);
    if (!item) return null;
    const wall = m.wallId ? project.room.walls.find((w) => w.id === m.wallId) : undefined;
    const wallLen = wall ? wallLength(wall) : 0;

    return (
      <>
        <div className="sidebar-header">
          <h2>Módulo</h2>
          <small>{item.sku}</small>
        </div>
        <div className="inspector">
          <div className="insp-row insp-title">{item.name}</div>
          <div className="insp-row insp-meta">
            <span>{item.width} × {item.depth} × {item.height} mm</span>
            <span>{item.price} €</span>
          </div>

          {wall && m.offsetFromStart !== undefined && (
            <>
              <label className="insp-field">
                <span>Muro</span>
                <select
                  value={m.wallId}
                  onChange={(e) => {
                    const newWall = project.room.walls.find((w) => w.id === e.target.value);
                    if (!newWall) return;
                    const newLen = wallLength(newWall);
                    const newOff = Math.max(0, Math.min(newLen - item.width, m.offsetFromStart ?? 0));
                    actions.updateModule(m.id, { wallId: newWall.id, offsetFromStart: newOff });
                  }}
                >
                  {project.room.walls.map((w, i) => (
                    <option key={w.id} value={w.id}>Muro {i + 1}</option>
                  ))}
                </select>
              </label>
              <label className="insp-field">
                <span>Offset (mm)</span>
                <input
                  type="number"
                  min={0}
                  max={Math.round(wallLen - item.width)}
                  step={10}
                  value={Math.round(m.offsetFromStart)}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(wallLen - item.width, Number(e.target.value) || 0));
                    actions.updateModule(m.id, { offsetFromStart: v });
                  }}
                />
              </label>
            </>
          )}

          {m.position && (
            <>
              <label className="insp-field">
                <span>X (mm)</span>
                <input
                  type="number"
                  step={10}
                  value={Math.round(m.position.x)}
                  onChange={(e) => actions.updateModule(m.id, { position: { x: Number(e.target.value) || 0, y: m.position!.y } })}
                />
              </label>
              <label className="insp-field">
                <span>Y (mm)</span>
                <input
                  type="number"
                  step={10}
                  value={Math.round(m.position.y)}
                  onChange={(e) => actions.updateModule(m.id, { position: { x: m.position!.x, y: Number(e.target.value) || 0 } })}
                />
              </label>
              <label className="insp-field">
                <span>Rotación</span>
                <input
                  type="number"
                  step={15}
                  value={Math.round((m.rotation * 180) / Math.PI)}
                  onChange={(e) => actions.updateModule(m.id, { rotation: ((Number(e.target.value) || 0) * Math.PI) / 180 })}
                />
              </label>
            </>
          )}

          <div className="insp-actions">
            <button type="button" onClick={() => actions.removeModule(m.id)} className="btn-danger">
              Eliminar
            </button>
            <button type="button" onClick={() => setSelection(null)} className="btn-ghost">
              Cerrar
            </button>
          </div>
        </div>
      </>
    );
  }

  // Obstacle
  const o = (project.room.obstacles ?? []).find((x) => x.id === selection.id);
  if (!o) return null;

  function updateObstacle(patch: Partial<Obstacle>) {
    actions.updateObstacle(o!.id, patch);
  }

  return (
    <>
      <div className="sidebar-header">
        <h2>{OBSTACLE_LABELS[o.kind]}</h2>
      </div>
      <div className="inspector">
        <label className="insp-field">
          <span>Tipo</span>
          <select value={o.kind} onChange={(e) => updateObstacle({ kind: e.target.value as ObstacleKind })}>
            {Object.entries(OBSTACLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="insp-field">
          <span>Ancho (mm)</span>
          <input type="number" min={50} step={10} value={o.width}
            onChange={(e) => updateObstacle({ width: Math.max(50, Number(e.target.value) || 0) })} />
        </label>
        <label className="insp-field">
          <span>Fondo (mm)</span>
          <input type="number" min={50} step={10} value={o.depth}
            onChange={(e) => updateObstacle({ depth: Math.max(50, Number(e.target.value) || 0) })} />
        </label>
        <label className="insp-field">
          <span>X (mm)</span>
          <input type="number" step={10} value={Math.round(o.position.x)}
            onChange={(e) => updateObstacle({ position: { ...o.position, x: Number(e.target.value) || 0 } })} />
        </label>
        <label className="insp-field">
          <span>Y (mm)</span>
          <input type="number" step={10} value={Math.round(o.position.y)}
            onChange={(e) => updateObstacle({ position: { ...o.position, y: Number(e.target.value) || 0 } })} />
        </label>
        <label className="insp-field">
          <span>Etiqueta</span>
          <input type="text" value={o.label ?? ""} placeholder="(opcional)"
            onChange={(e) => updateObstacle({ label: e.target.value || undefined })} />
        </label>
        <div className="insp-actions">
          <button type="button" onClick={() => actions.removeObstacle(o.id)} className="btn-danger">
            Eliminar
          </button>
          <button type="button" onClick={() => setSelection(null)} className="btn-ghost">
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
