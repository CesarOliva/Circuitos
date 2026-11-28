import Link from "next/link";
import type { ReactNode } from "react";
import { fichaPorSlug } from ".";
import "./con-ficha.css";

/** A gallery card plus a link to its technical sheet. The card stays interactive, so the link sits below it instead of wrapping it. */
export function ConFicha({ slug, children }: { slug: string; children: ReactNode }) {
  const ficha = fichaPorSlug(slug);
  if (!ficha) return <>{children}</>;
  return (
    <div className="con-ficha">
      {children}
      <Link className="con-ficha-link" href={`/fichas/${ficha.slug}`}>
        Ver ficha técnica de {ficha.titulo} →
      </Link>
    </div>
  );
}

/** Heading that opens the part's technical sheet (used on the faults page). */
export function TituloConFicha({ slug, children }: { slug: string; children: ReactNode }) {
  const ficha = fichaPorSlug(slug);
  return <h2>{ficha ? <Link className="con-ficha-titulo" href={`/fichas/${ficha.slug}`}>{children} →</Link> : children}</h2>;
}
