import { useState } from "react";
import "./App.css";
import { CatalogSidebar } from "./components/CatalogSidebar";
import { MetricsSidebar } from "./components/MetricsSidebar";
import { PlantaCanvas } from "./components/PlantaCanvas";
import { Scene3D } from "./components/Scene3D";
import { useProject, useStore } from "./store";

type TabKey = "planta" | "3d";

function Topbar() {
  const project = useProject();
  const rename = useStore((s) => s.actions.renameProject);
  const reset = useStore((s) => s.actions.resetProject);
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
      <button className="btn-ghost" onClick={() => reset()} title="Reiniciar proyecto">
        Reset
      </button>
    </header>
  );
}

function CenterTabs() {
  const [tab, setTab] = useState<TabKey>("planta");
  return (
    <main className="center">
      <nav className="tabs">
        <button
          className={tab === "planta" ? "tab active" : "tab"}
          onClick={() => setTab("planta")}
        >
          PLANTA
        </button>
        <button
          className={tab === "3d" ? "tab active" : "tab"}
          onClick={() => setTab("3d")}
        >
          3D
        </button>
      </nav>
      <div className="canvas-host">
        {tab === "planta" ? <PlantaCanvas /> : <Scene3D />}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="app">
      <Topbar />
      <div className="app-body">
        <CatalogSidebar />
        <CenterTabs />
        <MetricsSidebar />
      </div>
    </div>
  );
}
