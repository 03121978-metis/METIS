import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Altura máxima como fracción del alto disponible (0.4 - 0.95). */
  maxHeightFrac?: number;
  /** Muestra un botón X aparte del handle. */
  showClose?: boolean;
}

/** Bottom sheet con handle para arrastrar hacia abajo y cerrar, backdrop
 *  clicable, y transición de deslizamiento. Sigue las convenciones de
 *  iOS/Material 3 para tap targets (>= 44 px) y radio superior grande. */
export function BottomSheet({ open, onClose, title, children, maxHeightFrac = 0.85, showClose = true }: Props) {
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);

  // Reset offset cada vez que se abre.
  useEffect(() => {
    if (open) setDragOffset(0);
  }, [open]);

  // Bloquear scroll de body cuando el sheet está abierto (evita rebote iOS).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    startOffset.current = dragOffset;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragOffset(startOffset.current + dy);
  }
  function handleTouchEnd() {
    if (dragOffset > 120) onClose();
    else setDragOffset(0);
    startY.current = null;
  }

  return (
    <>
      <div
        className={`sheet-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`sheet ${open ? "open" : ""}`}
        style={{
          maxHeight: `${maxHeightFrac * 100}vh`,
          transform: open ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? "none" : undefined,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="sheet-drag"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="sheet-handle" />
        </div>
        {(title || showClose) && (
          <div className="sheet-header">
            {title && <h2 className="sheet-title">{title}</h2>}
            {showClose && (
              <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar">
                ×
              </button>
            )}
          </div>
        )}
        <div className="sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}
