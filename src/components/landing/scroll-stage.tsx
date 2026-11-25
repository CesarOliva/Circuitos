"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Escribe en --p el avance (de 0 a 1) del recorrido del contenedor; el CSS de landing.css arma la escena con ese valor.
export function ScrollStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.style.setProperty("--p", "1");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const travel = element.offsetHeight - window.innerHeight;
      const passed = -element.getBoundingClientRect().top / travel;
      const progress = travel > 0 ? Math.min(Math.max(passed, 0), 1) : 1;
      element.style.setProperty("--p", progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={`scroll-stage ${className}`.trim()}>
      {children}
    </div>
  );
}
