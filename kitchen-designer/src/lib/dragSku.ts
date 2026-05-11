// Singleton para compartir el SKU que se está arrastrando entre el catálogo
// y el canvas de la planta. HTML5 DnD no permite leer dataTransfer durante
// dragOver (solo durante drop), así que necesitamos un canal aparte para que
// el canvas pueda mostrar un preview con las dimensiones correctas.

let sku: string | null = null;

export function setDraggingSku(s: string | null): void {
  sku = s;
}

export function getDraggingSku(): string | null {
  return sku;
}
