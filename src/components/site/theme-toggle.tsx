"use client";

import { useLayoutEffect } from "react";

function readCookieTheme() {
  const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function ThemeToggle() {
  // En desarrollo, Strict Mode remonta y limpia el atributo que puso el script inline; esto lo repone.
  // En producción no cambia nada.
  useLayoutEffect(() => {
    const theme = readCookieTheme();
    if (theme) document.documentElement.setAttribute("data-theme", theme);
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") ?? "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `theme=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=Lax`;
  }

  // Se muestra el modo al que se cambia: sol en oscuro, luna en claro (lo decide el CSS con [data-theme]).
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
    >
      <svg className="theme-icon-sun" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.4" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
      </svg>
      <svg className="theme-icon-moon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.6 14.2A8.6 8.6 0 0 1 9.8 3.4a8.6 8.6 0 1 0 10.8 10.8Z" />
      </svg>
    </button>
  );
}
