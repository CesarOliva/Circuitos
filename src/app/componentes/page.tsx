import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { CATALOG } from "@/components/simulador/catalog";
import { ComponentFigure } from "@/components/simulador/figure";

export const metadata: Metadata = {
  title: "Componentes del simulador",
  description: "Cada clase de componente del simulador de circuitos, dibujada en isométrico con sus terminales.",
};

export default function ComponentesPage() {
  const folders = new Set(CATALOG.map((entry) => entry.folder)).size;
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <nav className="sim-nav" aria-label="Vistas">
          <span aria-current="page">Isométrico</span>
          <Link href="/componentes/3d">3D</Link>
          <Link href="/componentes/fallos">Fallos</Link>
        </nav>
        <h1>Componentes del simulador</h1>
        <p>
          {CATALOG.length} clases de <code>simulacion/src/components</code> en {folders} carpetas. Cada tarjeta instancia la clase real: los bornes, el
          readout y la lista de propiedades salen de <code>terminals</code> y <code>getProperties()</code>.
        </p>
      </header>
      <section className="sim-grid">
        {CATALOG.map((entry, index) => (
          <ComponentFigure key={entry.component.id} entry={entry} index={index} />
        ))}
      </section>
    </main>
  );
}
