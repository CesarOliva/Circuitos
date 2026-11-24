"use client";

import Link from "next/link";
import type { ComponentProps, PointerEvent } from "react";

// Un enlace que enciende un halo bajo el cursor: guarda la posición del puntero en variables CSS.
export function SpotlightLink({ className, ...props }: ComponentProps<typeof Link>) {
  function track(event: PointerEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  return <Link {...props} className={`spotlight ${className ?? ""}`} onPointerMove={track} />;
}
