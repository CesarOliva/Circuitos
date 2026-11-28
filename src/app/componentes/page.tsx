import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { CATALOG } from "@/components/simulador/catalog";
import { BOARD_LIST } from "@/components/simulador/boards";
import { BoardFigure } from "@/components/simulador/board-figure";
import { ComponentFigure } from "@/components/simulador/figure";
import { ConFicha } from "@/components/simulador/fichas/con-ficha";

export const metadata: Metadata = {
  title: "Componentes del simulador",
  description: "Cada clase de componente del simulador de circuitos, dibujada en isométrico con sus terminales.",
};

export default function ComponentesPage() {
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <nav className="sim-nav" aria-label="Vistas">
          <span aria-current="page">Componentes 2D</span>
          <Link href="/componentes/3d">Componentes 3D</Link>
          <Link href="/componentes/fallos">Componentes en fallo</Link>
          <Link href="/fichas">Fichas</Link>
        </nav>
        <h1>Componentes del simulador</h1>
        <p>Pasa sobre un terminal para identificarlo. Debajo de cada componente encontrarás el enlace a su ficha técnica.</p>
      </header>
      <section className="sim-grid">
        {CATALOG.map((entry, index) => (
          <ConFicha key={entry.component.id} slug={entry.component.type}>
            <ComponentFigure entry={entry} index={index} />
          </ConFicha>
        ))}
        {BOARD_LIST.map((design, index) => (
          <ConFicha key={design.id} slug={design.id}>
            <BoardFigure design={design} index={CATALOG.length + index} />
          </ConFicha>
        ))}
      </section>
    </main>
  );
}
