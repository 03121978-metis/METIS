import jsPDF from "jspdf";
import { getCatalogItem } from "../kitchen/catalog";
import { computeMetrics, validateProject, wallLength } from "../kitchen/validation";
import type { Project, ValidationIssue } from "../kitchen/types";
import { getStage } from "./stageRef";

function fmtMm(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(2)} m` : `${Math.round(n)} mm`;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "proyecto";
}

export async function exportProjectPdf(project: Project): Promise<void> {
  const metrics = computeMetrics(project);
  const issues = validateProject(project);
  const stage = getStage();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ─── Encabezado ────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(project.name, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(
    `Planificador de cocinas David H. — generado el ${new Date().toLocaleString("es-ES")}`,
    margin,
    y,
  );
  doc.setTextColor(0);
  y += 8;

  // ─── Snapshot de la planta ────────────────────────────────────────────
  if (stage) {
    try {
      const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
      const imgW = pageW - margin * 2;
      const imgH = imgW * 0.55;
      doc.addImage(dataUrl, "PNG", margin, y, imgW, imgH);
      doc.setDrawColor(200);
      doc.rect(margin, y, imgW, imgH);
      y += imgH + 6;
    } catch {
      // Si el stage no se puede serializar, seguimos sin imagen.
    }
  }

  // ─── Habitación + métricas en dos columnas ────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Habitación", margin, y);
  doc.text("Resumen", pageW / 2, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const room = [
    ["Techo", fmtMm(project.room.ceilingHeight)],
    ["Área", `${metrics.roomAreaM2.toFixed(2)} m²`],
    ["Perímetro", fmtMm(metrics.roomPerimeterMm)],
    ["Muros", String(project.room.walls.length)],
    ["Huecos", String(project.room.openings.length)],
    ["Obstáculos", String((project.room.obstacles ?? []).length)],
  ];
  const summary = [
    ["Presupuesto", fmtPrice(metrics.totalPrice)],
    ["Lineal bajos", fmtMm(metrics.baseLinearMm)],
    ["Lineal altos", fmtMm(metrics.wallLinearMm)],
    ["Lineal columnas", fmtMm(metrics.tallLinearMm)],
    ["Encimera", fmtMm(metrics.worktopLinearMm)],
    ["Muro libre", fmtMm(metrics.freeWallLinearMm)],
    ["Electrodomésticos", String(metrics.applianceCount)],
  ];
  const startY = y;
  for (const [k, v] of room) {
    doc.setTextColor(120);
    doc.text(k, margin, y);
    doc.setTextColor(0);
    doc.text(v, margin + 38, y);
    y += 4;
  }
  let y2 = startY;
  for (const [k, v] of summary) {
    doc.setTextColor(120);
    doc.text(k, pageW / 2, y2);
    doc.setTextColor(0);
    doc.text(v, pageW / 2 + 42, y2);
    y2 += 4;
  }
  y = Math.max(y, y2) + 4;

  // ─── Listado de módulos ────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Módulos", margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  if (project.modules.length === 0) {
    doc.setTextColor(120);
    doc.text("Sin módulos colocados.", margin, y);
    doc.setTextColor(0);
    y += 5;
  } else {
    // Agrupamos por SKU
    const grouped = new Map<string, number>();
    for (const m of project.modules) grouped.set(m.sku, (grouped.get(m.sku) ?? 0) + 1);

    // Cabecera
    doc.setFont("helvetica", "bold");
    doc.text("SKU", margin, y);
    doc.text("Descripción", margin + 28, y);
    doc.text("Ud.", margin + 115, y, { align: "right" });
    doc.text("Precio", margin + 135, y, { align: "right" });
    doc.text("Subtotal", margin + 170, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 1;
    doc.setDrawColor(180);
    doc.line(margin, y + 1, pageW - margin, y + 1);
    y += 4;

    let total = 0;
    for (const [sku, qty] of grouped) {
      const item = getCatalogItem(sku);
      if (!item) continue;
      const subtotal = item.price * qty;
      total += subtotal;
      doc.text(sku, margin, y);
      doc.text(item.name, margin + 28, y);
      doc.text(String(qty), margin + 115, y, { align: "right" });
      doc.text(fmtPrice(item.price), margin + 135, y, { align: "right" });
      doc.text(fmtPrice(subtotal), margin + 170, y, { align: "right" });
      y += 4;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    }
    doc.setDrawColor(180);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", margin + 115, y, { align: "right" });
    doc.text(fmtPrice(total), margin + 170, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  }

  // ─── Huecos ────────────────────────────────────────────────────────────
  if (project.room.openings.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Huecos", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    for (const op of project.room.openings) {
      const wIdx = project.room.walls.findIndex((w) => w.id === op.wallId);
      const tipo = op.kind === "door" ? "Puerta" : "Ventana";
      const wallName = wIdx >= 0 ? `M${wIdx + 1}` : op.wallId;
      const wall = project.room.walls[wIdx];
      const wLen = wall ? Math.round(wallLength(wall)) : 0;
      const sill = op.kind === "window" ? ` · alféizar ${op.sillHeight ?? 900}mm` : "";
      doc.text(
        `${tipo} · ${wallName} (${wLen}mm) · offset ${Math.round(op.offsetFromStart)}mm · ${op.width}×${op.height}mm${sill}`,
        margin,
        y,
      );
      y += 4;
      if (y > 280) { doc.addPage(); y = margin; }
    }
    y += 4;
  }

  // ─── Avisos ────────────────────────────────────────────────────────────
  if (issues.length > 0) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Avisos", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    for (const i of issues as ValidationIssue[]) {
      const tag = i.severity === "error" ? "[ERR]" : i.severity === "warning" ? "[WRN]" : "[INF]";
      const color: [number, number, number] =
        i.severity === "error" ? [192, 57, 43] :
        i.severity === "warning" ? [179, 137, 44] :
        [42, 111, 151];
      doc.setTextColor(...color);
      doc.text(tag, margin, y);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(i.message, pageW - margin * 2 - 14);
      doc.text(lines, margin + 12, y);
      y += 4 * lines.length;
      if (y > 280) { doc.addPage(); y = margin; }
    }
  }

  doc.save(`${slug(project.name)}.pdf`);
}
