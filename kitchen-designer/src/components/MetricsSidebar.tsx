import { useMemo } from "react";
import { useProject } from "../store";
import { computeMetrics, validateProject } from "../kitchen/validation";
import type { ValidationIssue } from "../kitchen/types";
import { RoomPanel } from "./RoomPanel";

function fmtMm(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} m`;
  return `${Math.round(n)} mm`;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function severityClass(s: ValidationIssue["severity"]): string {
  return `issue issue-${s}`;
}

export function MetricsSidebar() {
  const project = useProject();
  const metrics = useMemo(() => computeMetrics(project), [project]);
  const issues = useMemo(() => validateProject(project), [project]);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <aside className="sidebar sidebar-right">
      <RoomPanel />
      <div className="sidebar-header">
        <h2>Métricas</h2>
      </div>
      <dl className="metrics-list">
        <div><dt>Presupuesto</dt><dd>{fmtPrice(metrics.totalPrice)}</dd></div>
        <div><dt>Área habitación</dt><dd>{metrics.roomAreaM2.toFixed(2)} m²</dd></div>
        <div><dt>Perímetro</dt><dd>{fmtMm(metrics.roomPerimeterMm)}</dd></div>
        <div><dt>Muro libre</dt><dd>{fmtMm(metrics.freeWallLinearMm)}</dd></div>
        <div><dt>Lineal bajos</dt><dd>{fmtMm(metrics.baseLinearMm)}</dd></div>
        <div><dt>Lineal altos</dt><dd>{fmtMm(metrics.wallLinearMm)}</dd></div>
        <div><dt>Lineal columnas</dt><dd>{fmtMm(metrics.tallLinearMm)}</dd></div>
        <div><dt>Encimera</dt><dd>{fmtMm(metrics.worktopLinearMm)}</dd></div>
        <div><dt>Electrodomésticos</dt><dd>{metrics.applianceCount}</dd></div>
      </dl>

      <div className="sidebar-header">
        <h2>Avisos</h2>
        <small>
          {errors.length} err · {warnings.length} warn · {infos.length} info
        </small>
      </div>
      <ul className="issues-list">
        {issues.length === 0 && <li className="issue issue-ok">Sin conflictos.</li>}
        {issues.map((i, idx) => (
          <li key={`${i.code}-${idx}`} className={severityClass(i.severity)}>
            <span className="issue-code">{i.code}</span>
            <span className="issue-msg">{i.message}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
