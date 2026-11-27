"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/simulador", label: "Simulador" },
  { href: "/cursos", label: "Cursos" },
  { href: "/componentes", label: "Componentes" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/" aria-label="Circuitos, inicio">
          <span className="site-brand-mark" aria-hidden="true">C</span>
          <span className="site-brand-name">Circuitos</span>
        </Link>
        <nav className="site-nav" aria-label="Secciones del sitio">
          {LINKS.map(({ href, label }) => {
            const active = href === "/cursos" || href === "/componentes" ? pathname.startsWith(href) : pathname === href;
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          className="site-login"
          href="/iniciar-sesion"
          aria-current={pathname === "/iniciar-sesion" ? "page" : undefined}
        >
          Iniciar sesión
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
