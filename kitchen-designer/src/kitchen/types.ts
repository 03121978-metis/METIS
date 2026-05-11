// Dominio del Planificador de Cocinas David H.
// Todas las medidas en milímetros salvo precios (EUR) y ángulos (radianes).

export type Vec2 = { x: number; y: number };

export type Family =
  | "base"        // muebles bajos
  | "wall"        // muebles altos / colgantes
  | "tall"        // columna
  | "island"      // bloques de isla / península
  | "appliance"   // electrodomésticos
  | "sink"        // fregaderos
  | "worktop"     // tramos de encimera
  | "accessory";  // zócalos, cornisas, paneles

export type UtilityKind =
  | "water_supply"
  | "water_drain"
  | "gas"
  | "electrical_socket"
  | "electrical_220"
  | "electrical_380"
  | "ventilation";

export type OpeningKind = "window" | "door";

export type IssueSeverity = "error" | "warning" | "info";

export interface CatalogItem {
  sku: string;
  family: Family;
  name: string;
  width: number;          // dimensión a lo largo del muro
  depth: number;          // dimensión perpendicular al muro
  height: number;         // altura del módulo
  mountHeight?: number;   // altura sobre suelo del borde inferior (wall units)
  price: number;          // EUR sin IVA
  utilitiesRequired?: UtilityKind[];
  description?: string;
}

export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  thickness: number;
}

export interface Opening {
  id: string;
  wallId: string;
  kind: OpeningKind;
  offsetFromStart: number; // mm desde Wall.start a lo largo del muro
  width: number;
  height: number;
  sillHeight?: number;     // mm sobre suelo (sólo ventanas)
}

export interface ModulePlacement {
  id: string;
  sku: string;
  wallId?: string;         // null/undefined si es isla libre
  offsetFromStart?: number;
  position?: Vec2;         // sólo para islas libres
  rotation: number;        // radianes; 0 = alineado con el muro
  mirrored?: boolean;
}

export interface Utility {
  id: string;
  kind: UtilityKind;
  wallId?: string;
  offsetFromStart?: number;
  position?: Vec2;
  height: number;          // mm sobre suelo
}

export type ObstacleKind = "column" | "pilaster" | "niche" | "beam" | "generic";

export interface Obstacle {
  id: string;
  kind: ObstacleKind;
  position: Vec2;     // esquina sup-izq en mm (planta)
  width: number;      // mm en X
  depth: number;      // mm en Y
  height?: number;    // mm de altura (techo a suelo si llega)
  label?: string;
}

export interface Room {
  walls: Wall[];
  openings: Opening[];
  obstacles: Obstacle[];
  ceilingHeight: number;
}

export interface Project {
  id: string;
  name: string;
  room: Room;
  modules: ModulePlacement[];
  utilities: Utility[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  refs?: string[];
}

export interface Metrics {
  totalPrice: number;
  baseLinearMm: number;
  wallLinearMm: number;
  tallLinearMm: number;
  worktopLinearMm: number;
  baseCount: number;
  wallCount: number;
  tallCount: number;
  applianceCount: number;
  roomAreaM2: number;
  roomPerimeterMm: number;
  freeWallLinearMm: number;
}
