import { useEffect, useState } from "react";
import "./App.css";
import { CatalogSidebar } from "./components/CatalogSidebar";
import { MetricsSidebar } from "./components/MetricsSidebar";
import { PlantaCanvas } from "./components/PlantaCanvas";
import { Scene3D } from "./components/Scene3D";
import { BottomSheet } from "./components/BottomSheet";
import { Inspector } from "./components/Inspector";
import { useCanUndo, useProject, useStore } from "./store";
import { exportProjectPdf } from "./lib/exportPdf";
import { useIsMobile } from "./hooks/useMediaQuery";

type TabKey = "planta" | "3d";

/** Botón compacto con icono y label. Cumple 44 px de tap target. */
function IconButton({
  onClick,
  label,
  icon,
  active = false,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span className="icon-btn-glyph">{icon}</span>
      <span className="icon-btn-label">{label}</span>
    </button>
  );
}

function DesktopTopbar() {
  const project = useProject();
  const rename = useStore((s) => s.actions.renameProject);
  const reset = useStore((s) => s.actions.resetProject);
  const undo = useStore((s) => s.actions.undo);
  const canUndo = useCanUndo();

  return (
    <header className="topbar">
      <div className="brand">
        <strong>Planificador de cocinas</strong>
        <span className="brand-author">David H.</span>
      </div>
      <input
        className="project-name"
        value={project.name}
        onChange={(e) => rename(e.target.value)}
        spellCheck={false}
      />
      <button
        className="btn-ghost"
        onClick={() => undo()}
        disabled={!canUndo}
        title="Deshacer último cambio (Ctrl/Cmd+Z)"
      >
        ↶ Deshacer
      </button>
      <button
        className="btn-primary"
        onClick={() => exportProjectPdf(project)}
        title="Exportar a PDF"
      >
        Exportar PDF
      </button>
      <button className="btn-ghost" onClick={() => reset()} title="Reiniciar proyecto">
        Reset
      </button>
    </header>
  );
}

function MobileTopbar({ onMenu }: { onMenu: () => void }) {
  const project = useProject();
  const undo = useStore((s) => s.actions.undo);
  const canUndo = useCanUndo();
  return (
    <header className="topbar mobile">
      <button
        type="button"
        className="topbar-btn"
        onClick={() => undo()}
        disabled={!canUndo}
        aria-label="Deshacer"
      >↶</button>
      <div className="mobile-title" title={project.name}>{project.name}</div>
      <button
        type="button"
        className="topbar-btn"
        onClick={() => exportProjectPdf(project)}
        aria-label="Exportar PDF"
      >⇧</button>
      <button
        type="button"
        className="topbar-btn"
        onClick={onMenu}
        aria-label="Menú"
      >⋯</button>
    </header>
  );
}

function PlacingBanner() {
  const placingSku = useStore((s) => s.placingSku);
  const setPlacingSku = useStore((s) => s.setPlacingSku);
  if (!placingSku) return null;
  return (
    <div className="placing-banner">
      Modo colocar: <strong>{placingSku}</strong>. Toca la planta donde quieras el módulo.
      <button type="button" onClick={() => setPlacingSku(null)} className="placing-banner-cancel">
        Cancelar
      </button>
    </div>
  );
}

function DesktopLayout({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  return (
    <div className="app-body">
      <CatalogSidebar />
      <main className="center">
        <nav className="tabs">
          <button
            className={tab === "planta" ? "tab active" : "tab"}
            onClick={() => setTab("planta")}
          >PLANTA</button>
          <button
            className={tab === "3d" ? "tab active" : "tab"}
            onClick={() => setTab("3d")}
          >3D</button>
        </nav>
        <div className="canvas-host">
          {tab === "planta" ? <PlantaCanvas /> : <Scene3D />}
        </div>
      </main>
      <MetricsSidebar />
    </div>
  );
}

function MobileProjectMenu({ onClose }: { onClose: () => void }) {
  const project = useProject();
  const rename = useStore((s) => s.actions.renameProject);
  const reset = useStore((s) => s.actions.resetProject);
  return (
    <div className="mobile-menu">
      <label className="mobile-menu-field">
        <span>Nombre del proyecto</span>
        <input
          type="text"
          value={project.name}
          onChange={(e) => rename(e.target.value)}
          spellCheck={false}
        />
      </label>
      <button
        type="button"
        className="mobile-menu-item"
        onClick={() => { exportProjectPdf(project); onClose(); }}
      >Exportar PDF</button>
      <button
        type="button"
        className="mobile-menu-item danger"
        onClick={() => { if (confirm("¿Reiniciar el proyecto?")) { reset(); onClose(); } }}
      >Reiniciar proyecto</button>
    </div>
  );
}

function MobileLayout({
  tab,
  setTab,
  menuOpen,
  setMenuOpen,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const placingSku = useStore((s) => s.placingSku);
  const setPlacingSku = useStore((s) => s.setPlacingSku);
  const [sheet, setSheet] = useState<null | "catalog" | "info">(null);
  const [inspectorShown, setInspectorShown] = useState(false);

  // Al elegir un SKU en el catálogo, cerramos el catálogo para tocar la planta.
  useEffect(() => {
    if (placingSku && sheet === "catalog") setSheet(null);
  }, [placingSku, sheet]);

  // Al seleccionar algo, aparece el inspector automáticamente.
  useEffect(() => {
    if (selection) setInspectorShown(true);
  }, [selection]);

  return (
    <>
      <div className="mobile-canvas">
        {tab === "planta" ? <PlantaCanvas /> : <Scene3D />}
      </div>

      <nav className="mobile-nav" aria-label="Barra de acciones">
        <IconButton icon="☰" label="Catálogo" onClick={() => setSheet("catalog")} />
        <IconButton
          icon="⊞"
          label="Planta"
          active={tab === "planta"}
          onClick={() => setTab("planta")}
        />
        <IconButton
          icon="⋈"
          label="3D"
          active={tab === "3d"}
          onClick={() => setTab("3d")}
        />
        <IconButton icon="ⓘ" label="Info" onClick={() => setSheet("info")} />
      </nav>

      <BottomSheet
        open={sheet === "catalog"}
        onClose={() => setSheet(null)}
        title="Catálogo"
        maxHeightFrac={0.85}
      >
        <CatalogSidebar />
      </BottomSheet>

      <BottomSheet
        open={sheet === "info"}
        onClose={() => setSheet(null)}
        title="Habitación · Métricas"
        maxHeightFrac={0.85}
      >
        <MetricsSidebar />
      </BottomSheet>

      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Proyecto"
        maxHeightFrac={0.55}
      >
        <MobileProjectMenu onClose={() => setMenuOpen(false)} />
      </BottomSheet>

      <BottomSheet
        open={inspectorShown && !!selection}
        onClose={() => {
          setInspectorShown(false);
          setSelection(null);
        }}
        title="Selección"
        maxHeightFrac={0.65}
      >
        <Inspector />
      </BottomSheet>

      {placingSku && (
        <button
          type="button"
          className="fab-cancel"
          onClick={() => setPlacingSku(null)}
        >Cancelar colocación</button>
      )}
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("planta");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const undo = useStore((s) => s.actions.undo);
  const isMobile = useIsMobile();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  return (
    <div className={`app ${isMobile ? "mobile-app" : "desktop-app"}`}>
      {isMobile ? (
        <MobileTopbar onMenu={() => setMobileMenuOpen(true)} />
      ) : (
        <DesktopTopbar />
      )}
      <PlacingBanner />
      {isMobile ? (
        <MobileLayout
          tab={tab}
          setTab={setTab}
          menuOpen={mobileMenuOpen}
          setMenuOpen={setMobileMenuOpen}
        />
      ) : (
        <DesktopLayout tab={tab} setTab={setTab} />
      )}
    </div>
  );
}
