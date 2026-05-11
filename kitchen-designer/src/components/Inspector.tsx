import { useProject, useStore } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallLength } from "../kitchen/validation";
import type { ObstacleKind, OpeningKind } from "../kitchen/types";

const OBSTACLE_LABELS: Record<ObstacleKind, string> = {
  column: "Columna",
  pilaster: "Pilastra",
  niche: "Hornacina",
  beam: "Viga (suelo)",
  generic: "Obstáculo",
};

const OPENING_LABELS: Record<OpeningKind, string> = {
  door: "Puerta",
  window: "Ventana",
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
          Toca un módulo, obstáculo o hueco en la planta para editarlo. <br />
          Supr / Backspace lo elimina.
        </div>
      </>
    );
  }

  // ─── MODULE ─────────────────────────────────────────────────────────────
  if (selection.kind === "module") {
    const m = project.modules.find((x) => x.id === selection.id);
    if (!m) return null;
    const item = getCatalogItem(m.sku);
    if (!item) return null;
    const wall = m.wallId ? project.room.walls.find((w) => w.id === m.wallId) : undefined;
    const wallLen = wall ? wallLength(wall) : 0;
    const isWallAnchored = !!wall && m.offsetFromStart !== undefined;

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

          {isWallAnchored && wall && (
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
                  value={Math.round(m.offsetFromStart!)}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(wallLen - item.width, Number(e.target.value) || 0));
                    actions.updateModule(m.id, { offsetFromStart: v });
                  }}
                />
              </label>
              <div className="insp-field">
                <span>Rotación</span>
                <div className="insp-rotate">
                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const cur = ((m.rotation || 0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    const active = Math.abs(cur - rad) < 0.01;
                    return (
                      <button
                        key={deg}
                        type="button"
                        className={active ? "active" : ""}
                        onClick={() => actions.updateModule(m.id, { rotation: rad })}
                      >
                        {deg}°
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="insp-field insp-toggle">
                <span>Espejo</span>
                <input
                  type="checkbox"
                  checked={!!m.mirrored}
                  onChange={(e) => actions.updateModule(m.id, { mirrored: e.target.checked })}
                />
              </label>
            </>
          )}

          {!isWallAnchored && m.position && (
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
              <div className="insp-field">
                <span>Rotación</span>
                <div className="insp-rotate">
                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const active = Math.abs(((m.rotation % (Math.PI * 2)) - rad)) < 0.01;
                    return (
                      <button
                        key={deg}
                        type="button"
                        className={active ? "active" : ""}
                        onClick={() => actions.updateModule(m.id, { rotation: rad })}
                      >
                        {deg}°
                      </button>
                    );
                  })}
                </div>
              </div>
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

  // ─── OBSTACLE ───────────────────────────────────────────────────────────
  if (selection.kind === "obstacle") {
    const o = (project.room.obstacles ?? []).find((x) => x.id === selection.id);
    if (!o) return null;

    return (
      <>
        <div className="sidebar-header">
          <h2>{OBSTACLE_LABELS[o.kind]}</h2>
        </div>
        <div className="inspector">
          <label className="insp-field">
            <span>Tipo</span>
            <select value={o.kind} onChange={(e) => actions.updateObstacle(o.id, { kind: e.target.value as ObstacleKind })}>
              {Object.entries(OBSTACLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="insp-field">
            <span>Ancho (mm)</span>
            <input type="number" min={50} step={10} value={o.width}
              onChange={(e) => actions.updateObstacle(o.id, { width: Math.max(50, Number(e.target.value) || 0) })} />
          </label>
          <label className="insp-field">
            <span>Fondo (mm)</span>
            <input type="number" min={50} step={10} value={o.depth}
              onChange={(e) => actions.updateObstacle(o.id, { depth: Math.max(50, Number(e.target.value) || 0) })} />
          </label>
          <label className="insp-field">
            <span>X (mm)</span>
            <input type="number" step={10} value={Math.round(o.position.x)}
              onChange={(e) => actions.updateObstacle(o.id, { position: { ...o.position, x: Number(e.target.value) || 0 } })} />
          </label>
          <label className="insp-field">
            <span>Y (mm)</span>
            <input type="number" step={10} value={Math.round(o.position.y)}
              onChange={(e) => actions.updateObstacle(o.id, { position: { ...o.position, y: Number(e.target.value) || 0 } })} />
          </label>
          <label className="insp-field">
            <span>Etiqueta</span>
            <input type="text" value={o.label ?? ""} placeholder="(opcional)"
              onChange={(e) => actions.updateObstacle(o.id, { label: e.target.value || undefined })} />
          </label>
          <div className="insp-actions">
            <button type="button" onClick={() => actions.removeObstacle(o.id)} className="btn-danger">Eliminar</button>
            <button type="button" onClick={() => setSelection(null)} className="btn-ghost">Cerrar</button>
          </div>
        </div>
      </>
    );
  }

  // ─── OPENING ────────────────────────────────────────────────────────────
  const op = project.room.openings.find((x) => x.id === selection.id);
  if (!op) return null;
  const opWall = project.room.walls.find((w) => w.id === op.wallId);
  const opWallLen = opWall ? wallLength(opWall) : 0;

  return (
    <>
      <div className="sidebar-header">
        <h2>{OPENING_LABELS[op.kind]}</h2>
      </div>
      <div className="inspector">
        <label className="insp-field">
          <span>Tipo</span>
          <select value={op.kind} onChange={(e) => actions.updateOpening(op.id, { kind: e.target.value as OpeningKind })}>
            <option value="door">Puerta</option>
            <option value="window">Ventana</option>
          </select>
        </label>
        <label className="insp-field">
          <span>Muro</span>
          <select value={op.wallId} onChange={(e) => actions.updateOpening(op.id, { wallId: e.target.value })}>
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
            max={Math.max(0, Math.round(opWallLen - op.width))}
            step={10}
            value={Math.round(op.offsetFromStart)}
            onChange={(e) => {
              const v = Math.max(0, Math.min(opWallLen - op.width, Number(e.target.value) || 0));
              actions.updateOpening(op.id, { offsetFromStart: v });
            }}
          />
        </label>
        <label className="insp-field">
          <span>Ancho (mm)</span>
          <input type="number" min={300} step={10} value={op.width}
            onChange={(e) => actions.updateOpening(op.id, { width: Math.max(300, Number(e.target.value) || 0) })} />
        </label>
        <label className="insp-field">
          <span>Alto (mm)</span>
          <input type="number" min={500} step={10} value={op.height}
            onChange={(e) => actions.updateOpening(op.id, { height: Math.max(500, Number(e.target.value) || 0) })} />
        </label>
        {op.kind === "window" && (
          <label className="insp-field">
            <span>Alféizar (mm)</span>
            <input type="number" min={0} step={10} value={op.sillHeight ?? 900}
              onChange={(e) => actions.updateOpening(op.id, { sillHeight: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
        )}
        <div className="insp-actions">
          <button type="button" onClick={() => actions.removeOpening(op.id)} className="btn-danger">Eliminar</button>
          <button type="button" onClick={() => setSelection(null)} className="btn-ghost">Cerrar</button>
        </div>
      </div>
    </>
  );
}
