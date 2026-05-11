import type { CatalogItem, Family } from "./types";

export const CATALOG: CatalogItem[] = [
  // ─── BASE (muebles bajos) ────────────────────────────────────────────────
  { sku: "B-30-1P",  family: "base", name: "Bajo 30 · 1 puerta",       width: 300, depth: 580, height: 720, price: 145 },
  { sku: "B-40-1P",  family: "base", name: "Bajo 40 · 1 puerta",       width: 400, depth: 580, height: 720, price: 165 },
  { sku: "B-45-3C",  family: "base", name: "Bajo 45 · 3 cajones",      width: 450, depth: 580, height: 720, price: 245 },
  { sku: "B-60-1P",  family: "base", name: "Bajo 60 · 1 puerta",       width: 600, depth: 580, height: 720, price: 195 },
  { sku: "B-60-3C",  family: "base", name: "Bajo 60 · 3 cajones",      width: 600, depth: 580, height: 720, price: 285 },
  { sku: "B-80-2P",  family: "base", name: "Bajo 80 · 2 puertas",      width: 800, depth: 580, height: 720, price: 235 },
  { sku: "B-90-RIN", family: "base", name: "Bajo rincón 90·90",        width: 900, depth: 900, height: 720, price: 345 },

  // ─── WALL (muebles altos / colgantes) ────────────────────────────────────
  { sku: "W-40-1P",  family: "wall", name: "Alto 40 · 1 puerta",       width: 400, depth: 350, height: 720, mountHeight: 1450, price: 125 },
  { sku: "W-60-1P",  family: "wall", name: "Alto 60 · 1 puerta",       width: 600, depth: 350, height: 720, mountHeight: 1450, price: 155 },
  { sku: "W-60-EL",  family: "wall", name: "Alto 60 · elevable",       width: 600, depth: 350, height: 360, mountHeight: 1450, price: 215 },
  { sku: "W-80-2P",  family: "wall", name: "Alto 80 · 2 puertas",      width: 800, depth: 350, height: 720, mountHeight: 1450, price: 195 },
  { sku: "W-90-RIN", family: "wall", name: "Alto rincón 60·60",        width: 600, depth: 600, height: 720, mountHeight: 1450, price: 235 },

  // ─── TALL (columnas) ─────────────────────────────────────────────────────
  { sku: "T-60-HOR", family: "tall", name: "Columna 60 horno + micro", width: 600, depth: 580, height: 2150, price: 545,
    utilitiesRequired: ["electrical_220"] },
  { sku: "T-60-DES", family: "tall", name: "Columna 60 despensa",      width: 600, depth: 580, height: 2150, price: 395 },
  { sku: "T-60-FRI", family: "tall", name: "Columna 60 frigo encastre", width: 600, depth: 580, height: 2150, price: 425,
    utilitiesRequired: ["electrical_socket"] },

  // ─── APPLIANCE (electrodomésticos) ───────────────────────────────────────
  { sku: "A-IND-60", family: "appliance", name: "Placa inducción 60",  width: 600, depth: 520, height: 60, price: 485,
    utilitiesRequired: ["electrical_380", "ventilation"] },
  { sku: "A-GAS-60", family: "appliance", name: "Placa gas 60",        width: 600, depth: 520, height: 60, price: 245,
    utilitiesRequired: ["gas", "electrical_socket", "ventilation"] },
  { sku: "A-HOR-60", family: "appliance", name: "Horno 60 encastre",   width: 595, depth: 560, height: 595, price: 395,
    utilitiesRequired: ["electrical_220"] },
  { sku: "A-LAV-60", family: "appliance", name: "Lavavajillas 60",     width: 600, depth: 580, height: 815, price: 425,
    utilitiesRequired: ["water_supply", "water_drain", "electrical_socket"] },
  { sku: "A-CAM-60", family: "appliance", name: "Campana decorativa 60", width: 600, depth: 500, height: 200, mountHeight: 1500, price: 285,
    utilitiesRequired: ["electrical_socket", "ventilation"] },

  // ─── SINK (fregaderos) ───────────────────────────────────────────────────
  { sku: "S-1C-60",  family: "sink", name: "Fregadero 1 cubeta 60",    width: 600, depth: 500, height: 200, price: 165,
    utilitiesRequired: ["water_supply", "water_drain"] },
  { sku: "S-2C-80",  family: "sink", name: "Fregadero 2 cubetas 80",   width: 800, depth: 500, height: 200, price: 245,
    utilitiesRequired: ["water_supply", "water_drain"] },

  // ─── WORKTOP (tramos de encimera) ────────────────────────────────────────
  { sku: "WT-COMP-3000", family: "worktop", name: "Encimera compacto 30mm · 3000", width: 3000, depth: 620, height: 30, price: 425 },
  { sku: "WT-COMP-2400", family: "worktop", name: "Encimera compacto 30mm · 2400", width: 2400, depth: 620, height: 30, price: 345 },

  // ─── ACCESSORY ───────────────────────────────────────────────────────────
  { sku: "ACC-ZOC-3000", family: "accessory", name: "Zócalo H100 · 3000",  width: 3000, depth: 20, height: 100, price: 35 },
  { sku: "ACC-COR-2400", family: "accessory", name: "Cornisa superior · 2400", width: 2400, depth: 30, height: 60, price: 45 },
];

export const FAMILY_LABEL: Record<Family, string> = {
  base: "Bajos",
  wall: "Altos",
  tall: "Columnas",
  island: "Isla / Península",
  appliance: "Electrodomésticos",
  sink: "Fregaderos",
  worktop: "Encimeras",
  accessory: "Accesorios",
};

export const FAMILY_ORDER: Family[] = [
  "base",
  "wall",
  "tall",
  "appliance",
  "sink",
  "island",
  "worktop",
  "accessory",
];

export function getCatalogItem(sku: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.sku === sku);
}

export function groupByFamily(items: CatalogItem[] = CATALOG): Record<Family, CatalogItem[]> {
  const out = {} as Record<Family, CatalogItem[]>;
  for (const f of FAMILY_ORDER) out[f] = [];
  for (const item of items) out[item.family].push(item);
  return out;
}
