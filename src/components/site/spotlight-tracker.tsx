"use client";

import { useEffect } from "react";

// Las placas de la galería de componentes vienen del kit isométrico, así que se apuntan por selector en vez de por clase.
const TARGETS = ".spotlight, .sim-gallery .iso-plate";

// Un solo listener para todo el sitio: guarda la posición del puntero en --mx/--my del elemento con halo que esté debajo.
export function SpotlightTracker() {
  useEffect(() => {
    function track(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(TARGETS) : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      target.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("pointermove", track, { passive: true });
    return () => document.removeEventListener("pointermove", track);
  }, []);

  return null;
}
