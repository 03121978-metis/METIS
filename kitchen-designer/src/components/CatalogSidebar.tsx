import { useMemo, useState } from "react";
import { CATALOG, FAMILY_LABEL, FAMILY_ORDER, groupByFamily } from "../kitchen/catalog";
import type { Family } from "../kitchen/types";
import { useStore } from "../store";

export function CatalogSidebar() {
  const grouped = useMemo(() => groupByFamily(CATALOG), []);
  const placingSku = useStore((s) => s.placingSku);
  const setPlacingSku = useStore((s) => s.setPlacingSku);
  const [open, setOpen] = useState<Record<Family, boolean>>(() => {
    const o = {} as Record<Family, boolean>;
    for (const f of FAMILY_ORDER) o[f] = f === "base";
    return o;
  });

  function toggle(f: Family) {
    setOpen((prev) => ({ ...prev, [f]: !prev[f] }));
  }

  function pick(sku: string) {
    setPlacingSku(placingSku === sku ? null : sku);
  }

  return (
    <aside className="sidebar sidebar-left">
      <div className="sidebar-header">
        <h2>Catálogo</h2>
        <small>{CATALOG.length} SKUs</small>
      </div>
      <div className="catalog">
        {FAMILY_ORDER.map((family) => {
          const items = grouped[family];
          if (!items || items.length === 0) return null;
          const isOpen = open[family];
          return (
            <section key={family} className="catalog-family">
              <button
                type="button"
                className={`family-header ${isOpen ? "open" : ""}`}
                onClick={() => toggle(family)}
              >
                <span className="caret">{isOpen ? "▾" : "▸"}</span>
                <span className="family-label">{FAMILY_LABEL[family]}</span>
                <span className="family-count">{items.length}</span>
              </button>
              {isOpen && (
                <ul className="family-items">
                  {items.map((item) => (
                    <li key={item.sku}>
                      <button
                        type="button"
                        className={`catalog-card ${placingSku === item.sku ? "placing" : ""}`}
                        onClick={() => pick(item.sku)}
                        title={`${item.width} × ${item.depth} × ${item.height} mm — click para colocar`}
                      >
                        <div className="card-top">
                          <span className="card-sku">{item.sku}</span>
                          <span className="card-price">{item.price} €</span>
                        </div>
                        <div className="card-name">{item.name}</div>
                        <div className="card-dims">
                          {item.width} × {item.depth} × {item.height} mm
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
