# Planificador de cocinas David H — núcleo de dominio

Este directorio contiene el **esqueleto de datos y validación** del
planificador. Es independiente de la UI: ningún archivo importa de React,
Three.js, Konva, Zustand o jsPDF.

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Modelos: `Project`, `Room`, `Wall`, `Opening`, `ModulePlacement`, `Utility`, `CatalogItem`, `ValidationIssue`, `Metrics`. Todas las medidas en **milímetros**, precios en **EUR**, ángulos en **radianes**. |
| `catalog.ts` | Catálogo `CATALOG` agrupado por `Family`. Helpers `getCatalogItem(sku)`, `groupByFamily(items)`, `FAMILY_LABEL`, `FAMILY_ORDER`. |
| `validation.ts` | `validateProject(project)` y `computeMetrics(project)`. También expone geometría: `wallLength`, `projectOnWall`, `nearestWall`, `polygonAreaMm2`. |

## Convenios

- **Origen de muro**: `Wall.start` es el ancla. Posiciones en muros se
  expresan como `offsetFromStart` en mm a lo largo del segmento.
- **Profundidad** (`depth`) es la dimensión perpendicular al muro. Para
  bases el frente queda al ras del muro y la profundidad apunta hacia
  el interior de la habitación.
- **Wall units** llevan `mountHeight` (altura del borde inferior).
- **Utilities** se georreferencian con `(wallId, offsetFromStart)` o
  con `position` libre (suelo) y siempre llevan `height` (mm sobre
  suelo).

## Reglas de validación (códigos)

| Código | Severidad | Descripción |
|---|---|---|
| `MODULE_OUT_OF_WALL` | error | El módulo sobresale del muro asignado. |
| `MODULE_OVERLAP` | error | Dos módulos de la misma familia se solapan en el mismo muro. |
| `MODULE_HITS_OPENING` | error | El módulo invade un hueco. Excepción: wall units sobre el dintel o bajo el alféizar. |
| `MODULE_WALL_MISSING` | error | El módulo referencia un `wallId` que no existe. |
| `MODULE_SKU_MISSING` | error | SKU desconocido en el catálogo. |
| `UTILITY_MISSING` | warning | Electrodoméstico sin la utility requerida cerca (±200mm). |
| `ZONE_ADJACENT` | info | Frigo u horno a <600mm del fregadero. |

## Pendiente (no en este módulo)

- Exportación PDF (consumirá `Metrics` + `ValidationIssue[]`).
- Render fotorrealista (consumirá `Project` + `CATALOG`).
- Auto-completar muro con bajos estándar.
